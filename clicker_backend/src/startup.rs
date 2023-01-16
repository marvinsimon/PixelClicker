use std::io::{BufReader, Read, Write};
use axum_database_sessions::Key;
use sqlx::{Pool, Postgres};
use crate::create_dummy_players;
use crate::game_messages::{ClientMessages, ServerMessages};
use crate::sql_queries::no_players_in_db;

//// Initialisation and Setup Methods 

/// Generates a new session key
pub fn create_session_key() -> Key {
    std::fs::File::open("master-key")
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
        })
}

/// Generates a TypeScript file with all ServerMessages and ClientMessages
pub fn create_game_message_file_type_script() {
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
}

/// Checks if Player table is empty and creates Dummys if true
pub async fn check_for_players(pool: &Pool<Postgres>) {
    if no_players_in_db(pool).await {
        create_dummy_players(pool).await;
    }
}
