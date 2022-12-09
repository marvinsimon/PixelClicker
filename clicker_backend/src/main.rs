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
        .with_table_name("session_table")
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
        .route("/combat", get(attack))
        .layer(Extension(pool.clone()))
        .layer(AxumSessionLayer::new(session_store));

    #[cfg(debug_assertions)]
    {
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
        "SELECT id, game_state, timestamp FROM player WHERE email = $1 AND password = $2;",
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
            let prev_ore = game_state.ore;
            let prev_depth = game_state.depth;
            if elapsed_time > SECONDS_DAY {
                game_state.tick(SECONDS_DAY);
            } else {
                game_state.tick(elapsed_time * 10);
            }
            let ore_diff = game_state.ore - prev_ore;
            let depth_diff = game_state.depth - prev_depth;
            println!("STATE DIFF\n\
            ore: {}\n\
            depth: {}", ore_diff, depth_diff);
            write_state_dif_to_database(record.id, ore_diff, depth_diff, &pool).await;
            save_game_state_to_database(record.id, &game_state, &pool).await;
            save_score_to_database(record.id, &game_state, &pool).await;
            set_player_as_online(record.id, &pool).await;
            StatusCode::OK
        }
        Ok(None) => StatusCode::UNAUTHORIZED,
        Err(err) => {
            println!("{}", err);
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
        "SELECT id FROM player WHERE email = $1;",
        email
    )
        .fetch_optional(&pool)
        .await
    {
        Ok(Some(_)) => StatusCode::BAD_REQUEST,
        Ok(None) => {
            let game_state = GameState::new();
            let game_state_value = serde_json::to_value(&game_state).unwrap();
            match sqlx::query!(
                "INSERT INTO player (email, password, game_state) VALUES ($1, $2, $3) RETURNING id;",
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
                    set_player_as_online(r.id, &pool).await;
                    StatusCode::OK
                }
                Err(err) => {
                    println!("{}", err);
                    StatusCode::INTERNAL_SERVER_ERROR
                }
            }
        }
        Err(err) => {
            println!("{}", err);
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
        set_player_as_offline(id, &pool).await;
    }
    println!("Logging out!");
    session.remove(PLAYER_AUTH).await;
}

async fn connect_game(ws: WebSocketUpgrade, Extension(pool): Extension<PgPool>, session: AxumSession<AxumPgPool>) -> Response {
    println!("Connected!");
    ws.on_upgrade(move |socket| handle_game(socket, session, pool))
}

async fn attack(
    session: AxumSession<AxumPgPool>,
    Extension(pool): Extension<PgPool>,
) -> StatusCode {
    if let Some(id) = session.get::<i64>(PLAYER_AUTH).await {
        match sqlx::query!(
        "SELECT id FROM PVP WHERE id_att = $1;",
        id
    )
            .fetch_optional(&pool)
            .await {
            Ok(Some(_)) => {
                return StatusCode::BAD_REQUEST;
            }
            Ok(None) => {
                let defender_id = search_for_enemy(id, &pool).await;
                if defender_id == -1 {
                    if (sqlx::query!(
                "DELETE FROM PVP WHERE id_att = $1",
                id
            )
                        .execute(&pool)
                        .await).is_ok()
                    {
                        println!("No match found!");
                        return StatusCode::NO_CONTENT;
                    }
                } else {
                    calculate_combat(id, defender_id, &pool).await;
                }
                return StatusCode::OK;
            }
            Err(err) => {
                println!("{}", err);
                return StatusCode::INTERNAL_SERVER_ERROR;
            }
        }
    }
    StatusCode::BAD_REQUEST
}

async fn handle_game(mut socket: WebSocket, session: AxumSession<AxumPgPool>, pool: PgPool) {
    let mut game_state = GameState::new();
    let mut logged_in = false;
    let mut interval = Instant::now();

    if let Ok(None) = sqlx::query!(
        "SELECT * FROM player;"
    ).fetch_optional(&pool)
        .await {
            create_dummy_players(&pool).await;
    }
    
    'outer: loop {
        if let Some(id) = session.get::<i64>(PLAYER_AUTH).await {
            if !logged_in {
                if !test_for_new_registry(id, &pool).await {
                    game_state = load_game_state_from_database(id, &pool).await;
                    let event = ServerMessages::LoggedIn {};
                    if socket.send(Message::Text(serde_json::to_string(&event).unwrap()))
                        .await
                        .is_err() {
                        break;
                    }
                    if game_state.automation_started {
                        if let Ok(r) = sqlx::query!(
                            "SELECT offline_ore, offline_depth FROM player WHERE id = $1;",
                           id,
                            ).fetch_one(&pool)
                            .await {
                            let event = ServerMessages::MinedOffline { ore: r.offline_ore as u64, depth: r.offline_depth as u64 };
                            if socket.send(Message::Text(serde_json::to_string(&event).unwrap()))
                                .await
                                .is_err() {
                                break;
                            }
                        }
                    }
                }
                logged_in = true;
            } else if Duration::from_secs(2).saturating_sub(interval.elapsed()).is_zero() {
                save_game_state_to_database(id, &game_state, &pool).await;
                save_score_to_database(id, &game_state, &pool).await;
                interval = Instant::now();
            }
            let loot = handle_attacks(id, &pool).await;
            if loot > 0.0 {
                game_state.ore += loot;
                let event = ServerMessages::CombatElapsed { loot: loot as u64 };
                if socket
                    .send(Message::Text(serde_json::to_string(&event).unwrap()))
                    .await
                    .is_err()
                {
                    break;
                }
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
        save_timestamp_to_database(id, &pool).await;
    }
}

async fn create_dummy_players(pool: &PgPool) {
    let mut dummy_game_state = GameState::new();
    let mut email = "dummy";
    let mut password = "dummyPassword";
    dummy_game_state.is_dummy = true;

    for i in 1..10 {
        let full_email = format!("{}{}", email, i);
        dummy_game_state.ore = (500 + i * 500) as f64;
        dummy_game_state.depth = (400 + i * 400) as f64;
        dummy_game_state.attack_level = 1 + i * 10;
        dummy_game_state.defence_level = 2 + i * 5;
        let game_state_value = serde_json::to_value(&dummy_game_state).unwrap();
        if let Ok(_r) = sqlx::query!(
                "INSERT INTO player (email, password, game_state, pvp_score) VALUES ($1, $2, $3, $4) RETURNING id;",
                full_email,
                password,
                game_state_value,
                (100 * i) as i64,
        ).fetch_one(pool)
            .await {};
    }

    email = "ChuckNorris";
    password = "ROUNDHOUSEKICK";
    dummy_game_state.ore = 1000000.0;
    dummy_game_state.defence_level = 1000;
    let game_state_value = serde_json::to_value(&dummy_game_state).unwrap();
    if let Ok(_r) = sqlx::query!(
                "INSERT INTO player (email, password, game_state, pvp_score) VALUES ($1, $2, $3, $4) RETURNING id;",
                email,
                password,
                game_state_value,
                9007199254740991,
    ).fetch_one(pool)
        .await {};
}

async fn test_for_new_registry(id: i64, pool: &PgPool) -> bool {
    match sqlx::query!(
        "SELECT is_new FROM player WHERE id = $1;",
        id
    )
        .fetch_one(pool)
        .await {
        Ok(r) => {
            r.is_new
        }
        Err(_) => {
            false
        }
    }
}

async fn handle_attacks(id_att: i64, pool: &PgPool) -> f64 {
    let mut loot: f64 = 0.0;
    if let Ok(record) = sqlx::query!(
        "SELECT timestamp FROM PVP WHERE id_att = $1",
        id_att
    ).fetch_one(pool)
        .await {
        if Utc::now().timestamp() - record.timestamp >= 10 {
            loot = steal_resources(id_att, pool).await;
            if (sqlx::query!(
                "DELETE FROM PVP WHERE id_att = $1",
                id_att
            )
                .execute(pool)
                .await).is_ok() {}
        }
    }
    loot
}

async fn set_player_as_offline(id: i64, pool: &PgPool) {
    if (sqlx::query!(
        "UPDATE player SET is_online = false WHERE id = $1;",
        id,
    ).execute(pool)
        .await).is_ok() {}
}

async fn set_player_as_online(id: i64, pool: &PgPool) {
    if (sqlx::query!(
        "UPDATE player SET is_online = true WHERE id = $1;",
        id,
    ).execute(pool)
        .await).is_ok() {}
}

async fn save_timestamp_to_database(id: i64, pool: &PgPool) {
    if (sqlx::query!(
        "UPDATE player SET timestamp = $1 WHERE id = $2;",
        Utc::now().timestamp(),
        id,
    ).execute(pool)
        .await).is_ok() {}
}

async fn write_state_dif_to_database(id: i64, ore: f64, depth: f64, pool: &PgPool) {
    let i_ore = ore as i64;
    let i_depth = depth as i64;
    if (sqlx::query!(
        "UPDATE player SET offline_ore = $1, offline_depth = $2 WHERE id = $3;",
        i_ore,
        i_depth,
        id,
    ).execute(pool)
        .await).is_ok() {}
}

async fn save_game_state_to_database(id: i64, game_state: &GameState, pool: &PgPool) {
    let game_state_value = serde_json::to_value(game_state).unwrap();
    if (sqlx::query!(
        "UPDATE player SET game_state = $1, is_new = false WHERE id = $2;",
        game_state_value,
        id,
    ).execute(pool)
        .await).is_ok() {}
}

async fn save_score_to_database(id: i64, game_state: &GameState, pool: &PgPool) {
    let score_value = serde_json::to_value((game_state.depth / 10.0) as i32
        + game_state.attack_level + game_state.defence_level).unwrap().as_i64();
    if (sqlx::query!(
        "UPDATE player SET pvp_score = $1 WHERE id = $2;",
        score_value,
        id,
    ).execute(pool)
        .await).is_ok() {}
}

async fn load_game_state_from_database(id: i64, pool: &PgPool) -> GameState {
    println!("Loading GameState!");
    match sqlx::query!(
        "SELECT game_state, is_new FROM player WHERE id = $1;",
        id
    ).fetch_one(pool)
        .await
    {
        Ok(r) => {
            serde_json::from_value(r.game_state).unwrap()
        }
        Err(_) => GameState::new(),
    }
}

async fn search_for_enemy(id: i64, pool: &PgPool) -> i64 {
    match sqlx::query!(
        "SELECT pvp_score FROM player WHERE id = $1;",
        id
    )
        .fetch_one(pool)
        .await
    {
        Ok(r) => {
            match sqlx::query!(
                "SELECT id \
                FROM player WHERE is_online = false \
                AND pvp_score >= $1 ORDER BY pvp_score ASC;",
                r.pvp_score
            )
                .fetch_one(pool)
                .await
            {
                Ok(r) => {
                    println!("Match found: {}", r.id);
                    r.id
                }
                Err(_) => -1,
            }
        }
        Err(_err) => -1,
    }
}

async fn calculate_combat(id_att: i64, id_def: i64, pool: &PgPool) {
    let game_state_att = load_game_state_from_database(id_att, pool).await;
    let mut game_state_def = load_game_state_from_database(id_def, pool).await;
    let mut loot = game_state_def.ore * game_state_att.attack_level as f64
        / (4.0 * game_state_def.defence_level as f64);

    if loot > game_state_def.ore / 2.0 {
        loot = game_state_def.ore / 2.0;
    }

    if !game_state_def.is_dummy {
        game_state_def.ore -= loot;
        save_game_state_to_database(id_def, &game_state_def, pool).await;
    }

    if (sqlx::query!(
        "INSERT INTO PVP (id_att, id_def, loot, timestamp) VALUES ( $1, $2, $3, $4);",
        id_att,
        id_def,
        loot,
        Utc::now().timestamp()
    ).execute(pool)
        .await).is_ok() {
        println!("COMBAT DATA:\n\
        Attacker: {}\n\
        Defender: {}\n\
        Loot: {}",
                 id_att, id_def, loot);
    }
}

async fn steal_resources(attacker_id: i64, pool: &PgPool) -> f64 {
    let mut loot: f64 = 0.0;
    if let Ok(record_pvp) = sqlx::query!(
        "SELECT loot FROM PVP WHERE id_att = $1;",
        attacker_id
    )
        .fetch_one(pool)
        .await {
        loot = record_pvp.loot;
    }
    loot
}
