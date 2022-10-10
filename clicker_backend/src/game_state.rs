use crate::{ClientMessages, ServerMessages};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct GameState {
    pub depth: u64,
}

impl GameState {
    pub fn tick(&mut self, ticks: u64) -> ServerMessages {
        self.depth = self.depth + 1;
        ServerMessages::DigDown(self.depth)
    }

    /// Use this Function for Frontend -> Backend event handling
    pub fn handle(&mut self, event: ClientMessages) {
        match event {}
    }

    pub fn new() -> Self {
        GameState { depth: 0 }
    }
}
