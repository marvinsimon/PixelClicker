use crate::game_events::{ClientMessages, ServerMessages};
use crate::game_state::GameState;
use axum::{
    extract::ws::{Message, WebSocket, WebSocketUpgrade},
    http::StatusCode,
    response::Response,
    routing::get,
    Extension, Router,
};
use axum_auth::AuthBasic;
use axum_database_sessions::{
    AxumPgPool, AxumSession, AxumSessionConfig, AxumSessionStore, Key,
};
use dashmap::DashMap;
use sqlx::{PgPool, Pool};
use std::sync::Arc;
use std::net::SocketAddr;
use std::time::{Duration, Instant};
use tower_http::cors::CorsLayer;

mod game_events;
mod game_state;

type State = DashMap<i64, GameState>;

type GlobalState = Arc<State>;

const PLAYER_AUTH: &str = "player-auth";

#[tokio::main]
async fn main() {
    #[cfg(debug_assertions)]
    {
        use typescript_type_def::{write_definition_file, DefinitionFileOptions};
        type Api = (ServerMessages, ClientMessages);
        let ts_module = {
            let mut buf = Vec::new();
            let mut options = DefinitionFileOptions::default();
            options.root_namespace = None;
            write_definition_file::<_, Api>(&mut buf, options).unwrap();
            String::from_utf8(buf).unwrap()
        };

        std::fs::write("../clicker_frontend/src/game_messages.ts", ts_module).unwrap();
    }

    // build our application with a route
    #[allow(unused_mut)]
        let mut app = Router::new()
        // `GET /` goes to `root`
        .route("/", get(root))
        .route("/game", get(connect_game));

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

async fn sign_up(
    AuthBasic((email, password)): AuthBasic,
    session: AxumSession<AxumPgPool>,
    Extension(pool): Extension<PgPool>,
    Extension(state): Extension<GlobalState>,
) -> StatusCode {
    match sqlx::query!(
        "SELECT id FROM Player WHERE email = $1 AND password = $2;",
        email,
        password
    )
        .fetch_optional(&pool)
        .await
    {
        Ok(Some(_)) => StatusCode::BAD_REQUEST,
        Ok(None) => {
            let game_state = GameState {
                ore: 0,
                depth: 0,
                multiplier: 0,
                shovel_depth_level: 0
            };
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
                    state.insert(r.id, game_state);
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

/// basic handler that responds with a static string
async fn root() -> &'static str {
    "Hello, World!"
}

async fn connect_game(ws: WebSocketUpgrade) -> Response {
    println!("Connected");
    ws.on_upgrade(handle_game)
}

async fn handle_game(mut socket: WebSocket) {
    let mut game_state = GameState::new();
    'outer: loop {
        let instant = Instant::now();
        let mut event = game_state.tick(1);
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
                            let mut event = game_state.handle(serde_json::from_str(msg).unwrap());
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
                Ok(Some(Err(err))) => break 'outer,
                // Stream is closed -> Client disconnected
                Ok(None) => break 'outer,
                // Timeout occurred, handle next tick
                Err(_) => break,
            }
        }
    }
    // Todo: Save the game state
    println!("Disconnected");
}

