use crate::{ClientMessages, ServerMessages};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct GameState {
    pub ore: f64,
    pub depth: f64,
    pub multiplier: f64,
    pub shovel_depth_level: i32,
    pub auto_depth_level: i32,
    pub auto_speed_level: i32,
}

impl GameState {
    pub fn tick(&mut self, ticks: u64) -> ServerMessages {
        self.ore += ticks as f64 * self.multiplier;
        self.depth += ticks as f64 * (self.multiplier * self.auto_depth_level as f64);
        ServerMessages::NewState { ore: self.ore as u64, depth: self.depth as u64}
    }

    /// Use this Function for Frontend -> Backend event handling
    pub fn handle(&mut self, event: ClientMessages) -> ServerMessages{
        let mut upgrade_cost = self.shovel_depth_level * 50;
        let mut upgrade_auto_depth_cost = self.auto_depth_level * 50;
        let mut upgrade_auto_speed_cost = self.auto_speed_level * 50;
        let auto_digger_price = 200;
        match event {
            ClientMessages::Mine => {
                self.depth += self.shovel_depth_level as f64;
                self.ore += 1.0;
                ServerMessages::NewState { ore: self.ore as u64, depth: self.depth as u64}
            }
            ClientMessages:: UpgradeShovelDepth => {
                if upgrade_cost as f64 <= self.ore {
                    self.ore -= upgrade_cost as f64;
                    self.shovel_depth_level += 1;
                    upgrade_cost = self.shovel_depth_level * 50;
                    ServerMessages::ShovelDepthUpgraded{success: true, new_level: self.shovel_depth_level, new_upgrade_cost: upgrade_cost as u64}
                } else {
                    ServerMessages::ShovelDepthUpgraded{success: false, new_level: self.shovel_depth_level, new_upgrade_cost: upgrade_cost as u64}
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
            ClientMessages::UpgradeAutomationDepth => {
                if self.ore as u64 >= upgrade_auto_depth_cost as u64 {
                    self.auto_depth_level += 1;
                    upgrade_auto_depth_cost = self.auto_depth_level * 50;
                    ServerMessages::AutomationDepthUpgraded {success: true, new_level: self.auto_depth_level, new_upgrade_cost: upgrade_auto_depth_cost as u64}
                } else {
                    ServerMessages::AutomationDepthUpgraded {success: false, new_level: self.auto_depth_level, new_upgrade_cost: upgrade_auto_depth_cost as u64}
                }
            }
            ClientMessages::UpgradeAutomationSpeed => {
                if self.ore as u64 >= upgrade_auto_speed_cost as u64 {
                    self.auto_speed_level += 1;
                    upgrade_auto_speed_cost = self.auto_speed_level * 2;
                    ServerMessages::AutomationSpeedUpgraded {success: true, new_level: self.auto_speed_level, new_upgrade_cost: upgrade_auto_speed_cost as u64}
                } else {
                    ServerMessages::AutomationSpeedUpgraded {success: false, new_level: self.auto_speed_level, new_upgrade_cost: upgrade_auto_speed_cost as u64}
                }
            }
        }
    }

    pub fn new() -> Self {
        GameState { ore: 0.0, depth: 0.0, multiplier: 0.0, shovel_depth_level: 1, auto_depth_level: 1, auto_speed_level: 1,}
    }
}
