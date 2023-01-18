use std::time::Duration;

use axum::extract::ws::{Message, WebSocket};
use axum_database_sessions::{AxumPgPool, AxumSession};
use sqlx::{PgPool, Pool, Postgres};
use sqlx::types::chrono::Utc;
use tokio::time::Instant;

use crate::events::daily_event;
use crate::game_messages::{ClientMessages, ServerMessages};
use crate::game_state::GameState;
use crate::server::{create_session_table, start_server};
use crate::sql_queries::{get_top_players, get_profile_picture, get_username, insert_pvp_data, load_game_state_from_database, pvp_resource_query, save_game_state_to_database, save_score_to_database, save_timestamp_to_database, search_pvp_score, test_for_new_registry};
use crate::startup::{check_for_players, create_game_message_file_type_script, create_session_key};

mod game_messages;
mod game_state;
mod events;
mod sql_queries;
mod password_management;
mod startup;
mod server;

//// Main Method, Initialisations and Communication Routings

const SECONDS_DAY: i64 = 84600;

const PLAYER_AUTH: &str = "player-auth";

#[tokio::main]
async fn main() {
    let pool = connect_to_database().await.unwrap();

    create_game_message_file_type_script();

    // Initialize Events
    daily_event(&pool).await;

    // Check for dummy players
    check_for_players(&pool).await;

    // Starts the server and initializes a session table
    start_server(&pool, create_session_table(create_session_key(), &pool).await).await;
}


async fn connect_to_database() -> anyhow::Result<Pool<Postgres>> {

    let url = format!("postgresql://admin:clickerroyale@{}:5432/royal-db", std::env::var("POSTGRES_HOST"));

    println!("Connecting to: {}", url);

    Ok(Pool::connect(&url).await?)
}

/// Basic handler that responds with a static string
async fn root() -> &'static str {
    "Hello, World!"
}

/// Creates and maintains the game loop and handles the communication from within the game state and the frontend
async fn handle_game(mut socket: WebSocket, session: AxumSession<AxumPgPool>, pool: PgPool) {
    let mut game_state = GameState::new();
    let mut logged_in = false;
    let mut interval = Instant::now();
    socket.send(Message::Text(serde_json::to_string(&ServerMessages::SendLeaderboard { players: get_top_players(&pool).await.unwrap_or_default() }).unwrap())).await.unwrap_or(());
    'outer: loop {
        if let Some(id) = session.get::<i64>(PLAYER_AUTH) {

            // Tests if the current user is logged in and either prepares for a new login or saves the current gamestate respectively
            if !logged_in {
                if !test_for_new_registry(id, &pool).await {
                    game_state = load_game_state_from_database(id, &pool).await;
                    if socket.send(Message::Text(serde_json::to_string(&ServerMessages::LoggedIn {}).unwrap()))
                        .await
                        .is_err() {
                        break;
                    }
                    // Ask for username
                    ask_for_username(&mut socket, &pool, id).await;
                    // Ask for profile picture
                    ask_for_profile_picture(&mut socket, &pool, id).await;
                    // Send offline mined resources
                    send_offline_resources(&mut socket, &pool, &game_state, id).await;
                }
                logged_in = true;
            } else if Duration::from_secs(2).saturating_sub(interval.elapsed()).is_zero() {
                save_game_state_to_database(id, &game_state, &pool).await;
                save_score(id, &game_state, &pool).await;
                interval = Instant::now();
            }

            // Sends an event to frontend at the successful end of a combat instance
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
            socket.send(Message::Text(serde_json::to_string(&ServerMessages::SendPvpScore { pvp_score: search_pvp_score(id, &pool).await }).unwrap())).await.unwrap_or(());
        }

        // Updates the gamestate and frontend in set intervals
        let instant = Instant::now();
        if socket
            .send(Message::Text(serde_json::to_string(&game_state.tick(1)).unwrap()))
            .await
            .is_err()
        {
            break;
        }

        // Checks for and forwards event messages from the game state to the frontend and vice versa
        let mut tts = Duration::from_millis(50).saturating_sub(instant.elapsed());
        loop {
            match tokio::time::timeout(tts, socket.recv()).await {
                // Message successfully received
                Ok(Some(Ok(message))) => {
                    tts = tts.saturating_sub(instant.elapsed());
                    match &message.into_text() {
                        Ok(msg) => {
                            if msg.is_empty() {
                                break 'outer;
                            }
                            if socket
                                .send(Message::Text(serde_json::to_string(&game_state.handle(serde_json::from_str(msg).unwrap()))
                                    .unwrap()))
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

    // Regularly saves the game state
    if let Some(id) = session.get::<i64>(PLAYER_AUTH) {
        save_timestamp_to_database(id, &pool).await;
    }
}

/// Updates resources mined while the player was offline
async fn send_offline_resources(socket: &mut WebSocket, pool: &PgPool, game_state: &GameState, id: i64) {
    if game_state.automation_started {
        if let Ok(r) = sqlx::query!(
            "SELECT offline_ore, offline_depth FROM player WHERE id = $1;",
            id,
            ).fetch_one(pool).await {
            socket.send(Message::Text(serde_json::to_string(&ServerMessages::MinedOffline {
                ore: r.offline_ore as u64,
                depth: r.offline_depth as u64,
            }).unwrap())).await.unwrap_or(());
        }
    }
}

/// Retrieves the username from the database
async fn ask_for_username(socket: &mut WebSocket, pool: &PgPool, id: i64) {
    socket.send(Message::Text(serde_json::to_string(&ServerMessages::SetUsername {
        username: get_username(id, pool).await
    }).unwrap())).await.unwrap_or(());
}

/// Retrieves profile picture from the database
async fn ask_for_profile_picture(socket: &mut WebSocket, pool: &PgPool, id: i64) {
    socket.send(Message::Text(serde_json::to_string(&ServerMessages::SetProfilePicture {
        pfp: get_profile_picture(id, pool).await
    }).unwrap())).await.unwrap_or(());
}

/// Creates 10 dummy players with ascending strength
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
                "INSERT INTO player (email, username, password, game_state, pvp_score) VALUES ($1, $2, $3, $4, $5) RETURNING id;",
                full_email,
                full_email,
                password,
                game_state_value,
                (100 * i) as i64,
        ).fetch_one(pool).await {};
    }

    email = "ChuckNorris";
    password = "ROUNDHOUSEKICK";
    dummy_game_state.ore = 1000000.0;
    dummy_game_state.defence_level = 1000;
    let game_state_value = serde_json::to_value(&dummy_game_state).unwrap();
    if let Ok(_r) = sqlx::query!(
                "INSERT INTO player (email, username, password, game_state, pvp_score) VALUES ($1, $2, $3, $4, $5) RETURNING id;",
                email,
                email,
                password,
                game_state_value,
                9007199254740991,
    ).fetch_one(pool)
        .await {};
}

/// Retrieves an ongoing attack from the database and calculates the loot if the combat timer is elapsed
async fn handle_attacks(id_att: i64, pool: &PgPool) -> f64 {
    let mut loot: f64 = 0.0;
    if let Ok(record) = sqlx::query!(
        "SELECT timestamp FROM PVP WHERE id_att = $1",
        id_att
    ).fetch_one(pool)
        .await {
        if Utc::now().timestamp() - record.timestamp >= 600 {
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

/// Calculates and saves the combat score to the database
async fn save_score(id: i64, game_state: &GameState, pool: &PgPool) {
    let score_value = serde_json::to_value((game_state.depth / 10.0) as i32
        + game_state.attack_level + game_state.defence_level).unwrap().as_i64();
    save_score_to_database(id, pool, score_value.unwrap()).await;
}

/// Calculates the loot of a combat instance, skips subtraction from defending player if that player is a dummy
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

    // Creates a new entry in the PVP table
    insert_pvp_data(id_att, id_def, loot, pool).await;
}

/// Transfers loot ore from defending to attacking player
async fn steal_resources(attacker_id: i64, pool: &PgPool) -> f64 {
    pvp_resource_query(attacker_id, pool).await
}