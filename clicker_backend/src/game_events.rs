use serde::{Deserialize, Serialize};
use typescript_type_def::TypeDef;

#[derive(Deserialize, TypeDef)]
pub enum ClientMessages {
    //Insert events from frontend to backend
    Mine,
    SignUp,
    UpgradeShovelDepth,
    StartAutomation,
    SignOut,
}

#[derive(Serialize, TypeDef)]
pub enum ServerMessages {
    //Insert events from backend to frontend
    NewState {ore: u64, depth: u64},
    SignUp {signed_in: bool},
    ShovelDepthUpgraded {success: bool, new_level: i32, new_upgrade_cost: u64},
    AutomationStarted{success: bool},
}
