use crate::{ClientMessages, ServerMessages};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct GameState {
    pub ore: f64,
    pub depth: f64,
    pub multiplier: f64,
    pub shovel_amount_level: i32,
    pub shovel_depth_level: i32,
}

impl GameState {
    pub fn tick(&mut self, ticks: u64) -> ServerMessages {
        self.ore += ticks as f64 * self.multiplier;
        self.depth += ticks as f64 * self.multiplier;
        ServerMessages::NewState { ore: self.ore as u64, depth: self.depth as u64}
    }

    /// Use this Function for Frontend -> Backend event handling
    pub fn handle(&mut self, event: ClientMessages) -> ServerMessages{
        let mut depth_upgrade_cost = self.shovel_depth_level * 50;
        let mut amount_upgrade_cost = self.shovel_amount_level * 50;
        let auto_digger_price = 200;
        match event {
            ClientMessages::Mine => {
                self.depth += self.shovel_depth_level as f64;
                self.ore += 1.0;
                ServerMessages::NewState { ore: self.ore as u64, depth: self.depth as u64}
            }
            ClientMessages:: UpgradeShovelDepth => {
                if depth_upgrade_cost as f64 <= self.ore {
                    self.ore -= depth_upgrade_cost as f64;
                    self.shovel_depth_level += 1;
                    ServerMessages::ShovelDepthUpgraded{success: true, new_level: self.shovel_depth_level, new_upgrade_cost: depth_upgrade_cost as u64}
                } else {
                    ServerMessages::ShovelDepthUpgraded{success: false, new_level: self.shovel_depth_level, new_upgrade_cost: depth_upgrade_cost as u64}
                }
            }
            ClientMessages:: UpgradeShovelAmount => {
                if amount_upgrade_cost as f64 <= self.ore {
                    self.ore -= amount_upgrade_cost as f64;
                    self.shovel_amount_level += 1;
                    ServerMessages::ShovelAmountUpgraded{success: true, new_level: self.shovel_amount_level, new_upgrade_cost: amount_upgrade_cost as u64}
                } else {
                    ServerMessages::ShovelAmountUpgraded{success: false, new_level: self.shovel_amount_level, new_upgrade_cost: amount_upgrade_cost as u64}
                }
            }
            ClientMessages::StartAutomation => {
                if self.ore as u64 >= auto_digger_price {
                    self.ore = self.ore - auto_digger_price as f64;
                    self.multiplier = 0.05;
                    ServerMessages::AutomationStarted {success: true}
                } else {
                    ServerMessages::AutomationStarted {success: false}
                }
            }
        }
    }

    pub fn new() -> Self {
        GameState { ore: 0.0, depth: 0.0, multiplier: 0.0, shovel_amount_level: 1, shovel_depth_level: 1 }
    }
}
