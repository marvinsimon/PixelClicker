use std::net::SocketAddr;

use axum::{Extension, Router};
use axum::extract::WebSocketUpgrade;
use axum::http::{HeaderMap, StatusCode};
use axum::response::Response;
use axum::routing::get;
use axum_auth::AuthBasic;
use axum_database_sessions::{AxumPgPool, AxumSession, AxumSessionConfig, AxumSessionLayer, AxumSessionStore, Key};
use regex::Regex;
use rustrict::CensorStr;
use sqlx::{PgPool, Pool, Postgres};
use sqlx::types::chrono::Utc;

use crate::{calculate_combat, handle_game, PLAYER_AUTH, root, save_score, SECONDS_DAY};
use crate::game_state::GameState;
use crate::password_management::{hash_password, verify_password};
use crate::sql_queries::{insert_player_into_db, save_game_state_to_database, save_timestamp_to_database, search_for_enemy, set_player_as_offline, set_player_as_online, write_state_diff_to_database};

//// Server Routing and Communication methods are implemented and called from here

/// Starts the server and sets the routing
pub async fn start_server(pool: &Pool<Postgres>, session_store: AxumSessionStore<AxumPgPool>) {
    // Build our application with a route
    #[allow(unused_mut)]
        let mut app = Router::new()
        // `GET /` goes to `root`
        .route("/", get(root))
        .route("/game", get(connect_game))
        .route("/sign_up", get(sign_up))
        .route("/login", get(login))
        .route("/logout", get(logout))
        .route("/combat", get(attack))
        .route("/save_pfp", get(update_profile_picture))
        .layer(Extension(pool.clone()))
        .layer(AxumSessionLayer::new(session_store));

    #[cfg(debug_assertions)]
    {
        app = app.layer(tower_http::cors::CorsLayer::very_permissive().allow_credentials(true));
    }


    let addr = SocketAddr::from(([0, 0, 0, 0], 3001));
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}

/// Setup for the Axum Sessions
pub async fn create_session_table(key: Key, pool: &Pool<Postgres>) -> AxumSessionStore<AxumPgPool> {
    let session_config = AxumSessionConfig::default()
        .with_table_name("session_table")
        .with_key(key);

    let session_store = AxumSessionStore::<AxumPgPool>::new(Some(pool.clone().into()), session_config);

    // Create the Database table for storing our Session Data.
    session_store.initiate().await.unwrap();
    session_store
}

/// Creates a new Player entry if email, username and password are valid
async fn sign_up(
    AuthBasic((email, password)): AuthBasic, username: HeaderMap,
    session: AxumSession<AxumPgPool>,
    Extension(pool): Extension<PgPool>,
) -> StatusCode {
    // Checks if the email address already is registered for a user
    return match sqlx::query!(
        "SELECT id FROM player WHERE email = $1;",
        email
    )
        .fetch_optional(&pool)
        .await
    {
        Ok(Some(_)) => StatusCode::IM_A_TEAPOT,
        Ok(None) => {
            // Regex to check for correct email form
            let email_regex = Regex::new(r"^([a-z0-9_+]([a-z0-9_+.]*[a-z0-9_+])?)@([a-z0-9]+([a-z0-9]+)*\.[a-z]{2,6})").unwrap();
            let game_state = GameState::new();
            let game_state_value = serde_json::to_value(&game_state).unwrap();
            let extracted_username = username.get("Username").unwrap().to_str().unwrap().to_string();
            // Checks email regex and whether the username contains inappropriate terms
            if email_regex.is_match(&email) && !extracted_username.is_inappropriate() {
                // Creates a new player in the database
                let id =
                    insert_player_into_db(email
                                          , extracted_username
                                          , hash_password(password.unwrap().as_bytes())
                                          , game_state_value
                                          , &pool).await;
                return if id != -1 {
                    session.set(PLAYER_AUTH, id);
                    save_score(id, &game_state, &pool).await;
                    set_player_as_online(id, &pool).await;
                    StatusCode::OK
                } else {
                    StatusCode::INTERNAL_SERVER_ERROR
                };
            }
            StatusCode::NOT_ACCEPTABLE
        }
        Err(err) => {
            println!("{}", err);
            StatusCode::INTERNAL_SERVER_ERROR
        }
    };
}

/// Verifies login data and handles gamme state updates
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

            // Verifies the Password
            if !verify_password(record.password, password.unwrap().as_bytes()) {
                return StatusCode::UNAUTHORIZED;
            }
            session.set(PLAYER_AUTH, record.id);

            // Sets Game State and updates offline generated Resources
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

/// Saves Data, destroys current Session and resets Game State
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

/// Sets up the Game Connection
async fn connect_game(ws: WebSocketUpgrade, Extension(pool): Extension<PgPool>, session: AxumSession<AxumPgPool>) -> Response {
    println!("Connected!");
    ws.on_upgrade(move |socket| handle_game(socket, session, pool))
}


/// Checks for and sets up Entry for PVP table
async fn attack(
    session: AxumSession<AxumPgPool>,
    Extension(pool): Extension<PgPool>,
) -> StatusCode {
    // Checks if attacking Player already is in a Combat
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
                // Retrieves a suitable Opponent from the Database
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

async fn update_profile_picture(
    pfp: HeaderMap,
    session: AxumSession<AxumPgPool>,
    Extension(pool): Extension<PgPool>,
) -> StatusCode {
    println!("Setting PFP!");
    if let Some(id) = session.get::<i64>(PLAYER_AUTH) {
        let extracted_pfp = pfp.get("pfp").unwrap().to_str().unwrap();
        if (sqlx::query!(
        "UPDATE player SET profile_picture = $1 WHERE id = $2;",
            extracted_pfp,
            id
    ).execute(&pool)
            .await).is_ok() {
            return StatusCode::OK;
        }
    }
    StatusCode::BAD_REQUEST
}