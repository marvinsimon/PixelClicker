use crate::{ClientMessages, ServerMessages};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct GameState {
    pub ore: u64,
    pub depth: u64,
    pub multiplier: u64,
}

impl GameState {
    pub fn tick(&mut self, ticks: u64) -> ServerMessages {
        self.ore += ticks * self.multiplier;
        self.depth += ticks * self.multiplier;
        ServerMessages::NewState { ore: self.ore, depth: self.depth }
    }

    /// Use this Function for Frontend -> Backend event handling
    pub fn handle(&mut self, event: ClientMessages) {
        match event {
            // The depth is currently only increased once per event
            ClientMessages::Mine => {
                self.depth += 1;
                self.ore += 1;
            }
            ClientMessages::UpgradeShovel => {println!("Level Up")}
            ClientMessages::SignIn => {println!("Sign In")}
        }
    }

    pub fn new() -> Self {
        GameState { ore: 0, depth: 0, multiplier: 0 }
    }
}
