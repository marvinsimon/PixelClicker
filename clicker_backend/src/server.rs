use std::net::SocketAddr;
use axum::{Extension, Router};
use axum::routing::get;
use axum_database_sessions::{AxumPgPool, AxumSessionConfig, AxumSessionLayer, AxumSessionStore, Key};
use sqlx::{Pool, Postgres};
use tower_http::cors::CorsLayer;
use crate::{attack, connect_game, login, logout, root, sign_up};

pub async fn start_server(pool: &Pool<Postgres>, session_store: AxumSessionStore<AxumPgPool>) {
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


    let addr = SocketAddr::from(([127, 0, 0, 1], 3001));
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}

pub async fn create_session_table(key: Key, pool: &Pool<Postgres>) -> AxumSessionStore<AxumPgPool> {
    let session_config = AxumSessionConfig::default()
        .with_table_name("session_table")
        .with_key(key);

    let session_store = AxumSessionStore::<AxumPgPool>::new(Some(pool.clone().into()), session_config);

    //Create the Database table for storing our Session Data.
    session_store.initiate().await.unwrap();
    session_store
}

