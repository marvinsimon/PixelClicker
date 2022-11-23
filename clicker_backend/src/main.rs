use std::{net::SocketAddr, time::Duration};
use std::io::{BufReader, Read, Write};

use axum::{
    Extension,
    extract::ws::{Message, WebSocket, WebSocketUpgrade},
    http::StatusCode,
    response::Response,
    Router, routing::get,
};

use axum_auth::AuthBasic;
use axum_database_sessions::{AxumPgPool, AxumSession, AxumSessionConfig, AxumSessionLayer, AxumSessionStore, Key};

use sqlx::{PgPool, Pool};
use sqlx::types::chrono::Utc;
use tokio::time::Instant;
use tower_http::cors::CorsLayer;

use crate::game_events::{ClientMessages, ServerMessages};
use crate::game_state::GameState;

mod game_events;
mod game_state;

const SECONDS_DAY: i64 = 84600;

const PLAYER_AUTH: &str = "player-auth";

#[tokio::main]
async fn main() {
    #[cfg(debug_assertions)]
    {
        use typescript_type_def::{write_definition_file, DefinitionFileOptions};
        type Api = (ServerMessages, ClientMessages);
        let ts_module = {
            let mut buf = Vec::new();
            let options = DefinitionFileOptions {
                root_namespace: None,
                ..Default::default()
            };
            write_definition_file::<_, Api>(&mut buf, options).unwrap();
            String::from_utf8(buf).unwrap()
        };

        std::fs::write("../clicker_frontend/src/game_messages.ts", ts_module).unwrap();
    }

    let key = std::fs::File::open("master-key")
        .ok()
        .and_then(|file| {
            let mut reader = BufReader::new(file);
            let mut buffer = Vec::new();
            reader.read_to_end(&mut buffer).expect("could not read key");
            Key::try_from(buffer.as_slice()).ok()
        })
        .unwrap_or_else(|| {
            let key = Key::generate();
            let file = std::fs::File::options()
                .create(true)
                .write(true)
                .append(false)
                .open("master-key");
            if let Ok(mut file) = file {
                file.write_all(key.master())
                    .expect("could not write key to file");
            }
            key
        });

    let pool = connect_to_database().await.unwrap();
    let session_config = AxumSessionConfig::default()
        .with_table_name("test_table")
        .with_key(key);

    let session_store = AxumSessionStore::<AxumPgPool>::new(Some(pool.clone().into()), session_config);

    //Create the Database table for storing our Session Data.
    session_store.initiate().await.unwrap();
    // build our application with a route
    #[allow(unused_mut)]
        let mut app = Router::new()
        // `GET /` goes to `root`
        .route("/", get(root))
        .route("/game", get(connect_game))
        .route("/sign_up", get(sign_up))
        .route("/login", get(login))
        .route("/logout", get(logout))
        .layer(Extension(pool.clone()))
        .layer(AxumSessionLayer::new(session_store));

    #[cfg(debug_assertions)]
    {
        println!("Test");
        app = app.layer(CorsLayer::very_permissive().allow_credentials(true));
    }

    // run our app with hyper
    // `axum::Server` is a re-export of `hyper::Server`
    let addr = SocketAddr::from(([127, 0, 0, 1], 3001));
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}

async fn connect_to_database() -> anyhow::Result<Pool<sqlx::Postgres>> {
    Ok(Pool::connect("postgresql://admin:clickerroyale@localhost:5432/royal-db").await?)
}

/// basic handler that responds with a static string
async fn root() -> &'static str {
    "Hello, World!"
}

async fn login(
    AuthBasic((email, password)): AuthBasic,
    session: AxumSession<AxumPgPool>,
    Extension(pool): Extension<PgPool>,
) -> StatusCode {
    match sqlx::query!(
        "SELECT id, game_state, timestamp FROM Player WHERE email = $1 AND password = $2;",
        email,
        password
    )
        .fetch_optional(&pool)
        .await
    {
        Ok(Some(record)) => {
            session.set(PLAYER_AUTH, record.id).await;
            let mut game_state: GameState = serde_json::from_value(record.game_state).unwrap();
            let elapsed_time = Utc::now().timestamp() - record.timestamp.unwrap();
            if elapsed_time > SECONDS_DAY {
                game_state.tick(SECONDS_DAY);
            } else {
                game_state.tick(elapsed_time * 100);
            }
            save_game_state_to_database(record.id, &game_state, &pool).await;
            save_score_to_database(record.id, &game_state, &pool).await;
            StatusCode::OK
        }
        Ok(None) => StatusCode::UNAUTHORIZED,
        Err(err) => {
            println!("{err:#?}");
            StatusCode::INTERNAL_SERVER_ERROR
        }
    }
}

async fn sign_up(
    AuthBasic((email, password)): AuthBasic,
    session: AxumSession<AxumPgPool>,
    Extension(pool): Extension<PgPool>,
) -> StatusCode {
    match sqlx::query!(
        "SELECT id FROM Player WHERE email = $1;",
        email
    )
        .fetch_optional(&pool)
        .await
    {
        Ok(Some(_)) => StatusCode::BAD_REQUEST,
        Ok(None) => {
            let game_state = GameState::new();
            let game_state_value = serde_json::to_value(game_state.clone()).unwrap();
            match sqlx::query!(
                "INSERT INTO Player (email, password, game_state) VALUES ($1, $2, $3) RETURNING id;",
                email,
                password,
                game_state_value
            )
                .fetch_one(&pool)
                .await
            {
                Ok(r) => {
                    session.set(PLAYER_AUTH, r.id).await;
                    save_score_to_database(r.id, &game_state, &pool).await;
                    StatusCode::OK
                }
                Err(err) => {
                    println!("{err:#?}");
                    StatusCode::INTERNAL_SERVER_ERROR
                }
            }
        }
        Err(err) => {
            println!("{err:#?}");
            StatusCode::INTERNAL_SERVER_ERROR
        }
    }
}

async fn logout(
    session: AxumSession<AxumPgPool>,
    Extension(pool): Extension<PgPool>,
) {
    if let Some(id) = session.get::<i64>(PLAYER_AUTH).await {
        save_timestamp_to_database(id, &pool).await;
    }
    session.remove(PLAYER_AUTH).await;
}

async fn connect_game(ws: WebSocketUpgrade, Extension(pool): Extension<PgPool>, session: AxumSession<AxumPgPool>) -> Response {
    println!("Connected");
    ws.on_upgrade(move |socket| handle_game(socket, session, pool))
}

async fn handle_game(mut socket: WebSocket, session: AxumSession<AxumPgPool>, pool: PgPool) {
    let mut game_state = GameState::new();
    let mut logged_in = false;
    let mut interval = Instant::now();
    'outer: loop {
        if let Some(id) = session.get::<i64>(PLAYER_AUTH).await {
            if !logged_in {
                game_state = load_game_state_from_database(id, &pool).await;
                logged_in = true;
            } else if Duration::from_secs(2).saturating_sub(interval.elapsed()).is_zero() {
                save_game_state_to_database(id, &game_state, &pool).await;
                save_score_to_database(id, &game_state, &pool).await;
                interval = Instant::now();
            }
        }
        let instant = Instant::now();
        let event = game_state.tick(1);
        if socket
            .send(Message::Text(serde_json::to_string(&event).unwrap()))
            .await
            .is_err()
        {
            break;
        }
        let mut tts = Duration::from_millis(50).saturating_sub(instant.elapsed());
        loop {
            match tokio::time::timeout(tts, socket.recv()).await {
                // Message successfully received
                Ok(Some(Ok(message))) => {
                    // Todo: Wait the rest of the tts -> update tts to the new value
                    tts = tts.saturating_sub(instant.elapsed());
                    match &message.into_text() {
                        Ok(msg) => {
                            if msg.is_empty() {
                                break 'outer;
                            }
                            let event = game_state.handle(serde_json::from_str(msg).unwrap());
                            if socket
                                .send(Message::Text(serde_json::to_string(&event).unwrap()))
                                .await
                                .is_err()
                            {
                                break;
                            }
                        }
                        Err(_) => { break; }
                    }
                }
                // Message receiving failed -> Client disconnected
                Ok(Some(Err(_err))) => break 'outer,
                // Stream is closed -> Client disconnected
                Ok(None) => break 'outer,
                // Timeout occurred, handle next tick
                Err(_) => break,
            }
        }
    }
    if let Some(id) = session.get::<i64>(PLAYER_AUTH).await {
        println!("Reaching with id {}", id);
        save_timestamp_to_database(id, &pool).await;
    }
    println!("Disconnected");
}

async fn save_timestamp_to_database(id: i64, pool: &PgPool) {
    println!("Save timestamp");
    if (sqlx::query!(
        "UPDATE Player SET timestamp = $1 WHERE id = $2;",
        Utc::now().timestamp(),
        id,
    ).execute(pool)
        .await).is_ok() {}
}

async fn save_game_state_to_database(id: i64, game_state: &GameState, pool: &PgPool) {
    let game_state_value = serde_json::to_value(game_state).unwrap();
    if (sqlx::query!(
        "UPDATE Player SET game_state = $1 WHERE id = $2;",
        game_state_value,
        id,
    ).execute(pool)
        .await).is_ok() {}
}

async fn save_score_to_database(id: i64, game_state: &GameState, pool: &PgPool) {
    let score_value  = serde_json::to_value((game_state.depth / 10.0) as i32
        + game_state.attack_level + game_state.defence_level).unwrap().as_i64();
    if (sqlx::query!(
        "UPDATE Player SET pvp_score = $1 WHERE id = $2;",
        score_value,
        id,
    ).execute(pool)
        .await).is_ok() {}
}

async fn load_game_state_from_database(id: i64, pool: &PgPool) -> GameState {
    println!("Load Data");
    match sqlx::query!(
        "SELECT game_state FROM player WHERE id = $1",
        id
    ).fetch_one(pool)
        .await
    {
        Ok(r) => {
            println!("{:?}", r.game_state);
            serde_json::from_value(r.game_state).unwrap()
        }
        Err(_) => GameState::new(),
    }
}
