use crate::game_events::{ClientMessages, ServerMessages};
use crate::game_state::GameState;
use axum::extract::ws::{Message, WebSocket};
use axum::extract::WebSocketUpgrade;
use axum::response::Response;
use axum::routing::get;
use axum::{Router};
use std::net::SocketAddr;
use std::time::{Duration, Instant};
use tower_http::cors::CorsLayer;

mod game_events;
mod game_state;

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
                        Ok(msg) => { game_state.handle(serde_json::from_str(msg).unwrap()) }
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

