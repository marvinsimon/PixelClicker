use std::time::Duration;

use axum::{
    Extension,
    extract::ws::{Message, WebSocket, WebSocketUpgrade},
    http::StatusCode,
    response::Response,
};
use axum::http::HeaderMap;
use axum_auth::AuthBasic;
use axum_database_sessions::{AxumPgPool, AxumSession};
use regex::Regex;
use rustrict::CensorStr;
use sqlx::{PgPool, Pool, Postgres};
use sqlx::types::chrono::Utc;
use tokio::time::Instant;

use crate::events::daily_event;
use crate::game_messages::{ClientMessages, ServerMessages};
use crate::game_state::GameState;
use crate::password_management::{hash_password, verify_password};
use crate::server::{create_session_table, start_server};
use crate::sql_queries::{insert_pvp_data, load_game_state_from_database, pvp_resource_query, save_game_state_to_database, save_score_to_database, save_timestamp_to_database, search_for_enemy, set_player_as_offline, set_player_as_online, test_for_new_registry, write_state_diff_to_database};
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

async fn login(
    AuthBasic((email, password)): AuthBasic,
    session: AxumSession<AxumPgPool>,
    Extension(pool): Extension<PgPool>,
) -> StatusCode {
    match sqlx::query!(
        "SELECT id, game_state, password, timestamp FROM player WHERE (email = $1 OR username = $1);",
        email
    )
        .fetch_optional(&pool)
        .await
    {
        Ok(Some(record)) => {
            if !verify_password(record.password, password.unwrap().as_bytes()) {
                return StatusCode::UNAUTHORIZED;
            }
            session.set(PLAYER_AUTH, record.id);
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
            write_state_diff_to_database(record.id, ore_diff, depth_diff, &pool).await;
            save_game_state_to_database(record.id, &game_state, &pool).await;
            save_score(record.id, &game_state, &pool).await;
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
    AuthBasic((email, password)): AuthBasic, username: HeaderMap,
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
            let email_regex = Regex::new(r"^([a-z0-9_+]([a-z0-9_+.]*[a-z0-9_+])?)@([a-z0-9]+([a-z0-9]+)*\.[a-z]{2,6})").unwrap();
            let game_state = GameState::new();
            let game_state_value = serde_json::to_value(&game_state).unwrap();
            let extracted_username = username.get("Username").unwrap().to_str().unwrap();
            let inappropriate: bool = extracted_username.is_inappropriate();
            if email_regex.is_match(&email) && !inappropriate {
                return match sqlx::query!(
                "INSERT INTO player (email, username, password, game_state) VALUES ($1, $2, $3, $4) RETURNING id;",
                email,
                extracted_username,
                hash_password(password.unwrap().as_bytes()),
                game_state_value
            )
                    .fetch_one(&pool)
                    .await
                {
                    Ok(r) => {
                        session.set(PLAYER_AUTH, r.id);
                        save_score(r.id, &game_state, &pool).await;
                        set_player_as_online(r.id, &pool).await;
                        StatusCode::OK
                    }
                    Err(err) => {
                        println!("{}", err);
                        StatusCode::INTERNAL_SERVER_ERROR
                    }
                };
            }
            StatusCode::NOT_ACCEPTABLE
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
    if let Some(id) = session.get::<i64>(PLAYER_AUTH) {
        save_timestamp_to_database(id, &pool).await;
        set_player_as_offline(id, &pool).await;
    }
    println!("Logging out!");
    session.remove(PLAYER_AUTH);
}

async fn connect_game(ws: WebSocketUpgrade, Extension(pool): Extension<PgPool>, session: AxumSession<AxumPgPool>) -> Response {
    println!("Connected!");
    ws.on_upgrade(move |socket| handle_game(socket, session, pool))
}

async fn attack(
    session: AxumSession<AxumPgPool>,
    Extension(pool): Extension<PgPool>,
) -> StatusCode {
    if let Some(id) = session.get::<i64>(PLAYER_AUTH) {
        return match sqlx::query!(
        "SELECT id FROM PVP WHERE id_att = $1;",
        id
    )
            .fetch_optional(&pool)
            .await {
            Ok(Some(_)) => {
                StatusCode::BAD_REQUEST
            }
            Ok(None) => {
                let defender_id = search_for_enemy(id, &pool).await;
                if defender_id == -1 {
                    if (sqlx::query!(
                "DELETE FROM PVP WHERE id_att = $1",
                id
            ).execute(&pool).await).is_ok() {
                        println!("No match found!");
                        return StatusCode::NO_CONTENT;
                    }
                } else {
                    calculate_combat(id, defender_id, &pool).await;
                }
                StatusCode::OK
            }
            Err(err) => {
                println!("{}", err);
                StatusCode::INTERNAL_SERVER_ERROR
            }
        };
    }
    StatusCode::BAD_REQUEST
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