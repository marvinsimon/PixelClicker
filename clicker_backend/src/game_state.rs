use std::thread::sleep;
use crate::{ClientMessages, ServerMessages};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct GameState {
    pub ore: u64,
    pub depth: u64,
    pub multiplier: u64,
    pub shovel_level: i32,
}

impl GameState {
    pub fn tick(&mut self, ticks: u64) -> ServerMessages {
        self.ore += ticks * self.multiplier;
        self.depth += ticks * self.multiplier;
        ServerMessages::NewState { ore: self.ore, depth: self.depth }
    }

    /// Use this Function for Frontend -> Backend event handling
    pub fn handle(&mut self, event: ClientMessages){
        let upgrade_costs = [50,  100, 200, 400, 800];
        let max_level = 5;
        match event {
            // The depth is currently only increased once per event
            ClientMessages::Mine => {
                self.depth += self.shovel_level as u64;
                self.ore += self.shovel_level as u64;
            }

            ClientMessages:: UpgradeShovel => {
                if self.shovel_level < max_level &&
                    upgrade_costs[(self.shovel_level-1) as usize] <= self.ore {
                    self.ore = self.ore - upgrade_costs[(self.shovel_level-1) as usize];
                    self.shovel_level += 1;
                }
            }
        }
    }

    pub fn new() -> Self {
        GameState { ore: 0, depth: 0, multiplier: 0, shovel_level: 1 }
    }
}
