use crate::{ClientMessages, ServerMessages};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct GameState {
    pub ore: u64,
}

impl GameState {
    pub fn tick(&mut self, ticks: u64) -> ServerMessages {
        ServerMessages::MineOre(&self.ore * ticks)
    }

    /// Use this Function for Frontend -> Backend event handling
    pub fn handle(&mut self, event: ClientMessages) {
        match event {}
    }

    pub fn new() -> Self {
        GameState { ore: 0 }
    }
}
