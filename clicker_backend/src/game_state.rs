use crate::{ClientMessages, ServerMessages};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct GameState {
    pub depth: u64,
    pub multiplier: u64,
}

impl GameState {
    pub fn tick(&mut self, ticks: u64) -> ServerMessages {
        ServerMessages::NewDepth(self.depth + self.multiplier * ticks)
    }

    /// Use this Function for Frontend -> Backend event handling
    pub fn handle(&mut self, event: ClientMessages) {
        match event {
            // The depth is currently only increased once per event
            DigDown => self.depth = self.depth + 1,
        }
    }

    pub fn new() -> Self {
        GameState { depth: 0, multiplier: 0 }
    }
}
