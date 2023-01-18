use crate::game_messages::{ClientMessages, ServerMessages};

/// Generates a TypeScript file with all ServerMessages and ClientMessages
pub fn create_game_message_file_type_script() {
    use typescript_type_def::{DefinitionFileOptions, write_definition_file};
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

    std::fs::write("shared_volume/game_messages.ts", ts_module).unwrap();
}