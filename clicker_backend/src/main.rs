use std::time::Duration;

use axum::{
    extract::ws::{Message, WebSocket},
};
use axum_database_sessions::{AxumPgPool, AxumSession};
use sqlx::{PgPool, Pool, Postgres};
use sqlx::types::chrono::Utc;
use tokio::time::Instant;

use crate::events::daily_event;
use crate::game_messages::{ClientMessages, ServerMessages};
use crate::game_state::GameState;
use crate::server::{create_session_table, start_server};
use crate::sql_queries::{insert_pvp_data, load_game_state_from_database, pvp_resource_query, save_game_state_to_database, save_score_to_database, save_timestamp_to_database,  test_for_new_registry };
use crate::startup::{check_for_players, create_game_message_file_type_script, create_session_key};

mod game_messages;
mod game_state;
mod events;
mod sql_queries;
mod password_management;
mod startup;
mod server;

const SECONDS_DAY: i64 = 84600;

const PLAYER_AUTH: &str = "player-auth";

#[tokio::main]
async fn main() {
    let pool = connect_to_database().await.unwrap();

    create_game_message_file_type_script();
    //Initialize Events
    daily_event(&pool).await;

    //Check for dummy players
    check_for_players(&pool).await;

    start_server(&pool, create_session_table(create_session_key(), &pool).await).await;
}


async fn connect_to_database() -> anyhow::Result<Pool<Postgres>> {
    Ok(Pool::connect("postgresql://admin:clickerroyale@localhost:5432/royal-db").await?)
}

/// basic handler that responds with a static string
async fn root() -> &'static str {
    "Hello, World!"
}


async fn handle_game(mut socket: WebSocket, session: AxumSession<AxumPgPool>, pool: PgPool) {
    let mut game_state = GameState::new();
    let mut logged_in = false;
    let mut interval = Instant::now();


    'outer: loop {
        if let Some(id) = session.get::<i64>(PLAYER_AUTH) {
            if !logged_in {
                if !test_for_new_registry(id, &pool).await {
                    game_state = load_game_state_from_database(id, &pool).await;
                    let event = ServerMessages::LoggedIn {};
                    if socket.send(Message::Text(serde_json::to_string(&event).unwrap()))
                        .await
                        .is_err() {
                        break;
                    }
                    //ask for username
                    ask_for_username(&mut socket, &pool, id).await;
                    //send offline mined resources
                    send_offline_resources(&mut socket, &pool, &game_state, id).await;
                }
                logged_in = true;
            } else if Duration::from_secs(2).saturating_sub(interval.elapsed()).is_zero() {
                save_game_state_to_database(id, &game_state, &pool).await;
                save_score(id, &game_state, &pool).await;
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
    if let Some(id) = session.get::<i64>(PLAYER_AUTH) {
        save_timestamp_to_database(id, &pool).await;
    }
}

async fn send_offline_resources(socket: &mut WebSocket, pool: &PgPool, game_state: &GameState, id: i64) {
    if game_state.automation_started {
        if let Ok(r) = sqlx::query!(
                            "SELECT offline_ore, offline_depth FROM player WHERE id = $1;",
                           id,
                            ).fetch_one(pool)
            .await {
            let event = ServerMessages::MinedOffline { ore: r.offline_ore as u64, depth: r.offline_depth as u64 };
            if socket.send(Message::Text(serde_json::to_string(&event).unwrap()))
                .await
                .is_err() {}
        }
    }
}

async fn ask_for_username(socket: &mut WebSocket, pool: &PgPool, id: i64) {
    let event = ServerMessages::SetUsername { username: get_username(id, pool).await };
    if socket.send(Message::Text(serde_json::to_string(&event).unwrap()))
        .await
        .is_err() {}
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
                "INSERT INTO player (email, username, password, game_state, pvp_score) VALUES ($1, $2, $3, $4, $5) RETURNING id;",
                full_email,
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
                "INSERT INTO player (email, username, password, game_state, pvp_score) VALUES ($1, $2, $3, $4, $5) RETURNING id;",
                email,
                email,
                password,
                game_state_value,
                9007199254740991,
    ).fetch_one(pool)
        .await {};
}

async fn get_username(id: i64, pool: &PgPool) -> String {
    match sqlx::query!(
        "SELECT username FROM player WHERE id = $1;",
        id
    )
        .fetch_one(pool)
        .await
    {
        Ok(r) => {
            r.username
        }
        Err(_) => {
            "Error".to_string()
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

async fn save_score(id: i64, game_state: &GameState, pool: &PgPool) {
    let score_value = serde_json::to_value((game_state.depth / 10.0) as i32
        + game_state.attack_level + game_state.defence_level).unwrap().as_i64();
    save_score_to_database(id, pool, score_value.unwrap()).await;
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

    insert_pvp_data(id_att, id_def, loot, pool).await;
}

async fn steal_resources(attacker_id: i64, pool: &PgPool) -> f64 {
    pvp_resource_query(attacker_id, pool).await
}