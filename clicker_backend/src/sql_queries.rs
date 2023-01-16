use serde_json::Value;
use sqlx::PgPool;
use sqlx::types::chrono::Utc;

use crate::events::EventType;
use crate::game_state::GameState;

//// Database Queries go here

/// Inserts a Player into the Player table
pub async fn insert_player_into_db(email: String, username: String, password: String, game_state_value: Value, pool: &PgPool) -> i64 {
    match sqlx::query!(
        "INSERT INTO player (email, username, password, game_state) VALUES ($1, $2, $3, $4) RETURNING id;",
        email,
        username,
        password,
        game_state_value).fetch_one(pool).await {
        Ok(r) => r.id,
        Err(_) => -1,
    }
}

/// Inserts Events into the Event table
pub async fn fill_event_table(events: Vec<&str>, event_type: EventType, pool: &PgPool) {
    for x in events {
        sqlx::query!("INSERT INTO Event(event_text, classification) VALUES ($1, $2)",
            x,
            event_type as _
        )
            .execute(pool).await.expect("Failure");
    }
}

/// Selects calculated loot for current attack
pub async fn pvp_resource_query(attacker_id: i64, pool: &PgPool) -> f64 {
    sqlx::query!(
        "SELECT loot FROM PVP WHERE id_att = $1;",
        attacker_id
    )
        .fetch_one(pool)
        .await.expect("Failure").loot
}

/// Inserts a combat entry into the PVP table
pub async fn insert_pvp_data(id_att: i64, id_def: i64, loot: f64, pool: &PgPool) {
    sqlx::query!(
        "INSERT INTO PVP (id_att, id_def, loot, timestamp) VALUES ( $1, $2, $3, $4);",
        id_att,
        id_def,
        loot,
        Utc::now().timestamp()
    ).execute(pool).await.expect("Failure at attack");
}

/// Updates a Game State in the Player table
pub async fn save_game_state_to_database(id: i64, game_state: &GameState, pool: &PgPool) {
    let game_state_value = serde_json::to_value(game_state).unwrap();
    sqlx::query!(
        "UPDATE player SET game_state = $1, is_new = false WHERE id = $2;",
        game_state_value,
        id,
    ).execute(pool)
        .await.expect("GameState was not saved");
}

/// Retrieves a Player from the Player table which has a pvp score close to the attacking Player
pub async fn search_for_enemy(id: i64, pool: &PgPool) -> i64 {
    let pvp_score = search_pvp_score(id, pool).await;
    match sqlx::query!(
                "SELECT id \
                FROM player WHERE is_online = false \
                AND pvp_score >= $1 ORDER BY pvp_score ASC;",
                pvp_score
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

/// Selects pvp score of a Player from the Player table
async fn search_pvp_score(id: i64, pool: &PgPool) -> i64 {
    sqlx::query!(
        "SELECT pvp_score FROM player WHERE id = $1;",
        id
    )
        .fetch_one(pool)
        .await.unwrap().pvp_score.unwrap_or(-1)
}

/// Sets the timestamp of a Player
pub async fn save_timestamp_to_database(id: i64, pool: &PgPool) {
    if (sqlx::query!(
        "UPDATE player SET timestamp = $1 WHERE id = $2;",
        Utc::now().timestamp(),
        id,
    ).execute(pool)
        .await).is_ok() {}
}

/// Sets the offline ore and offline depth of a Player
pub async fn write_state_diff_to_database(id: i64, ore: f64, depth: f64, pool: &PgPool) {
    let i_ore = ore as i64;
    let i_depth = depth as i64;
    sqlx::query!(
        "UPDATE player SET offline_ore = $1, offline_depth = $2 WHERE id = $3;",
        i_ore,
        i_depth,
        id,
    ).execute(pool).await.expect("DB problems");
}

/// Gets a game state from the Player table
pub async fn load_game_state_from_database(id: i64, pool: &PgPool) -> GameState {
    println!("Loading GameState!");
    serde_json::from_value(sqlx::query!(
        "SELECT game_state, is_new FROM player WHERE id = $1;",
        id
    ).fetch_one(pool)
        .await.expect("If a player exists, there must be a GameState").game_state).unwrap()
    //serde_json::from_value(r.game_state).unwrap()
}

/// Sets a game state in the Player table
pub async fn save_score_to_database(id: i64, pool: &PgPool, score_value: i64) {
    sqlx::query!(
        "UPDATE player SET pvp_score = $1 WHERE id = $2;",
        score_value,
        id,
    ).execute(pool)
        .await.expect("DB problem");
}

/// Sets online flag of a Player as true
pub async fn set_player_as_online(id: i64, pool: &PgPool) {
    if (sqlx::query!(
        "UPDATE player SET is_online = true WHERE id = $1;",
        id,
    ).execute(pool)
        .await).is_ok() {}
}

/// Sets online flag of a Player as false
pub async fn set_player_as_offline(id: i64, pool: &PgPool) {
    sqlx::query!(
        "UPDATE player SET is_online = false WHERE id = $1;",
        id,
    ).execute(pool).await.expect("DB problem");
}

/// Checks if a Player was recently created
pub async fn test_for_new_registry(id: i64, pool: &PgPool) -> bool {
    sqlx::query!(
        "SELECT is_new FROM player WHERE id = $1;",
        id
    )
        .fetch_one(pool)
        .await.unwrap().is_new
}

/// Checks if the Player table is empty
pub async fn no_players_in_db(pool: &PgPool) -> bool {
    sqlx::query!(
        "SELECT * FROM player;"
    ).fetch_optional(pool)
        .await.expect("DB failure").is_none()
}

/// Gets the username of a Player
pub async fn get_username(id: i64, pool: &PgPool) -> String {
    sqlx::query!(
        "SELECT username FROM player WHERE id = $1;",
        id
    ).fetch_one(pool).await.expect("DB failure").username
}
