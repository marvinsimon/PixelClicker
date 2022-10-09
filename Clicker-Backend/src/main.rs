use crate::game_events::{ClientMessages, ServerMessages};

mod game_events;

fn main() {
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

        std::fs::write("../Clicker-Frontend/src/game_messages.ts", ts_module).unwrap();
    }
}
