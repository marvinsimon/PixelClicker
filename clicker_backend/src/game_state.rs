use crate::{ClientMessages, ServerMessages};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct GameState {
    pub ore: f64,
    pub depth: f64,
    pub multiplier: f64,
    pub shovel_amount_level: i32,
    pub shovel_depth_level: i32,
    pub auto_depth_level: i32,
    pub auto_amount_level: i32,
    pub attack_level: i32,
    pub defense_level: i32,
}

impl GameState {
    pub fn tick(&mut self, ticks: i64) -> ServerMessages {
        self.ore += ticks as f64 * (self.multiplier * self.auto_amount_level as f64);
        self.depth += ticks as f64 * (self.multiplier * self.auto_depth_level as f64);
        ServerMessages::NewState {
            ore: self.ore as u64,
            depth: self.depth as u64,
        }
    }

    /// Use this Function for Frontend -> Backend event handling
    pub fn handle(&mut self, event: ClientMessages) -> ServerMessages {
        let depth_upgrade_cost = self.shovel_depth_level * 50;
        let amount_upgrade_cost = self.shovel_amount_level * 50;
        let mut upgrade_auto_depth_cost = self.auto_depth_level * 50;
        let mut upgrade_auto_amount_cost = self.auto_amount_level * 50;
        let mut upgrade_attack_level = self.attack_level * 50;
        let mut upgrade_defense_level = self.defense_level * 50;
        let auto_digger_price = 200;
        match event {
            ClientMessages::Mine => {
                self.depth += self.shovel_depth_level as f64;
                self.ore += self.shovel_amount_level as f64;
                ServerMessages::NewState {
                    ore: self.ore as u64,
                    depth: self.depth as u64,
                }
            }
            ClientMessages::UpgradeShovelDepth => {
                if depth_upgrade_cost as f64 <= self.ore {
                    self.ore -= depth_upgrade_cost as f64;
                    self.shovel_depth_level += 1;
                    ServerMessages::ShovelDepthUpgraded {
                        success: true,
                        new_level: self.shovel_depth_level,
                        new_upgrade_cost: depth_upgrade_cost as u64,
                    }
                } else {
                    ServerMessages::ShovelDepthUpgraded {
                        success: false,
                        new_level: self.shovel_depth_level,
                        new_upgrade_cost: depth_upgrade_cost as u64,
                    }
                }
            }
            ClientMessages::UpgradeShovelAmount => {
                if amount_upgrade_cost as f64 <= self.ore {
                    self.ore -= amount_upgrade_cost as f64;
                    self.shovel_amount_level += 1;
                    ServerMessages::ShovelAmountUpgraded {
                        success: true,
                        new_level: self.shovel_amount_level,
                        new_upgrade_cost: amount_upgrade_cost as u64,
                    }
                } else {
                    ServerMessages::ShovelAmountUpgraded {
                        success: false,
                        new_level: self.shovel_amount_level,
                        new_upgrade_cost: amount_upgrade_cost as u64,
                    }
                }
            }
            ClientMessages::StartAutomation => {
                if self.ore as u64 >= auto_digger_price {
                    self.ore -= auto_digger_price as f64;
                    self.multiplier = 0.05;
                    ServerMessages::AutomationStarted { success: true }
                } else {
                    ServerMessages::AutomationStarted { success: false }
                }
            }
            ClientMessages::UpgradeAutomationDepth => {
                if self.ore as u64 >= upgrade_auto_depth_cost as u64 {
                    self.ore -= upgrade_auto_depth_cost as f64;
                    self.auto_depth_level += 1;
                    upgrade_auto_depth_cost = self.auto_depth_level * 50;
                    ServerMessages::AutomationDepthUpgraded {
                        success: true,
                        new_level: self.auto_depth_level,
                        new_upgrade_cost: upgrade_auto_depth_cost as u64,
                    }
                } else {
                    ServerMessages::AutomationDepthUpgraded {
                        success: false,
                        new_level: self.auto_depth_level,
                        new_upgrade_cost: upgrade_auto_depth_cost as u64,
                    }
                }
            }
            ClientMessages::UpgradeAutomationAmount => {
                if self.ore as u64 >= upgrade_auto_amount_cost as u64 {
                    self.ore -= upgrade_auto_amount_cost as f64;
                    self.auto_amount_level += 1;
                    upgrade_auto_amount_cost = self.auto_amount_level * 50;
                    ServerMessages::AutomationAmountUpgraded {
                        success: true,
                        new_level: self.auto_amount_level,
                        new_upgrade_cost: upgrade_auto_amount_cost as u64}
                } else {
                    ServerMessages::AutomationAmountUpgraded {
                        success: false,
                        new_level: self.auto_amount_level,
                        new_upgrade_cost: upgrade_auto_amount_cost as u64}
                }
            }
            ClientMessages::UpgradeAttackLevel => {
                if self.ore as u64 >= upgrade_attack_level as u64 {
                    self.ore -= upgrade_attack_level as f64;
                    self.attack_level += 1;
                    upgrade_attack_level = self.attack_level * 50;
                    ServerMessages::AttackLevelUpgraded {
                        success: true,
                        new_level: self.attack_level,
                        new_upgrade_cost: upgrade_attack_level as u64}
                } else {
                    ServerMessages::AttackLevelUpgraded {
                        success: false,
                        new_level: self.attack_level,
                        new_upgrade_cost: upgrade_attack_level as u64}
                }
            }
            ClientMessages::UpgradeDefenseLevel => {
                if self.ore as u64 >= upgrade_defense_level as u64 {
                    self.ore -= upgrade_defense_level as f64;
                    self.defense_level += 1;
                    upgrade_defense_level = self.defense_level * 50;
                    ServerMessages::DefenseLevelUpgraded {
                        success: true,
                        new_level: self.defense_level,
                        new_upgrade_cost: upgrade_defense_level as u64}
                } else {
                    ServerMessages::DefenseLevelUpgraded {
                        success: false,
                        new_level: self.defense_level,
                        new_upgrade_cost: upgrade_defense_level as u64}
                }
            }
        }
    }

    pub fn new() -> Self {
        GameState {
            ore: 0.0,
            depth: 0.0,
            multiplier: 0.0,
            shovel_amount_level: 1,
            shovel_depth_level: 1,
            auto_depth_level: 1,
            auto_amount_level: 1,
            attack_level: 1,
            defense_level: 1,
        }
    }
}
