use serde::{Deserialize, Serialize};
use typescript_type_def::TypeDef;

#[derive(Deserialize, TypeDef)]
pub enum ClientMessages {
    //Insert events from frontend to backend
    Mine,
    UpgradeShovel,
    SignIn,
}

#[derive(Serialize, TypeDef)]
pub enum ServerMessages {
    //Insert events from backend to frontend
    NewState {ore: u64, depth: u64},
    ShovelLevel {level: u64},
    SignIn {success: bool},
}
