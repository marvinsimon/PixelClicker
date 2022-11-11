use serde::{Deserialize, Serialize};
use typescript_type_def::TypeDef;

#[derive(Deserialize, TypeDef)]
pub enum ClientMessages {
    //Insert events from frontend to backend
    Mine,
    UpgradeShovelAmount,
    UpgradeShovelDepth,
    StartAutomation,
    UpgradeAutomationDepth,
    UpgradeAutomationAmount,
    UpgradeAttackLevel,
    UpgradeDefenseLevel,
}

#[derive(Serialize, TypeDef)]
pub enum ServerMessages {
    //Insert events from backend to frontend
    NewState {ore: u64, depth: u64},
    ShovelAmountUpgraded {success: bool, new_level: i32, new_upgrade_cost: u64},
    ShovelDepthUpgraded {success: bool, new_level: i32, new_upgrade_cost: u64},
    AutomationStarted{success: bool},
    AutomationDepthUpgraded{success: bool, new_level: i32, new_upgrade_cost: u64},
    AutomationAmountUpgraded{success: bool, new_level: i32, new_upgrade_cost: u64},
    AttackLevelUpgraded{success: bool, new_level: i32, new_upgrade_cost: u64},
    DefenseLevelUpgraded{success: bool, new_level: i32, new_upgrade_cost: u64},
}
