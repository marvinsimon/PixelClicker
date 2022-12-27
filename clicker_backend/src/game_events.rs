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
    UpgradeDefenceLevel,
    GetLoginData,
    Treasure,
    Diamond
}

#[derive(Serialize, TypeDef)]
pub enum ServerMessages {
    //Insert events from backend to frontend
    NewState { ore: u64, depth: u64 },
    ShovelAmountUpgraded { success: bool, new_level: i32, new_upgrade_cost: u64 },
    ShovelDepthUpgraded { success: bool, new_level: i32, new_upgrade_cost: u64 },
    AutomationStarted { success: bool },
    AutomationDepthUpgraded { success: bool, new_level: i32, new_upgrade_cost: u64 },
    AutomationAmountUpgraded { success: bool, new_level: i32, new_upgrade_cost: u64 },
    AttackLevelUpgraded { success: bool, new_level: i32, new_upgrade_cost: u64 },
    DefenceLevelUpgraded { success: bool, new_level: i32, new_upgrade_cost: u64 },
    LoginState { shovel_amount: i32, shovel_depth: i32, automation_depth: i32, automation_amount: i32, attack_level: i32, defence_level: i32, automation_started: bool, diamond: i32 },
    CombatElapsed{loot: u64},
    LoggedIn {},
    MinedOffline{ore: u64, depth: u64},
    TreasureFound{ore: u64},
    DiamondFound{diamond: i32}
}
