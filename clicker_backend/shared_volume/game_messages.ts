// AUTO-GENERATED by typescript-type-def

export type U64=number;
export type I32=number;
export type I64=number;
export type ServerMessages=({"NewState":{"ore":U64;"depth":U64;};}|{"ShovelAmountUpgraded":{"success":boolean;"new_level":I32;"new_upgrade_cost":U64;};}|{"ShovelDepthUpgraded":{"success":boolean;"new_level":I32;"new_upgrade_cost":U64;};}|{"AutomationStarted":{"success":boolean;};}|{"AutomationDepthUpgraded":{"success":boolean;"new_level":I32;"new_upgrade_cost":U64;};}|{"AutomationAmountUpgraded":{"success":boolean;"new_level":I32;"new_upgrade_cost":U64;};}|{"AttackLevelUpgraded":{"success":boolean;"new_level":I32;"new_upgrade_cost":U64;};}|{"DefenceLevelUpgraded":{"success":boolean;"new_level":I32;"new_upgrade_cost":U64;};}|{"LoginState":{"shovel_amount":I32;"shovel_depth":I32;"automation_depth":I32;"automation_amount":I32;"attack_level":I32;"defence_level":I32;"automation_started":boolean;"diamond":I32;};}|{"CombatElapsed":{"loot":U64;};}|{"LoggedIn":{};}|{"MinedOffline":{"ore":U64;"depth":U64;};}|{"TreasureFound":{"ore":U64;};}|{"DiamondFound":{"diamond":I32;};}|{"GameData":{"picked_first_diamond":boolean;};}|{"SetUsername":{"username":string;};}|{"SetProfilePicture":{"pfp":string;};}|{"SendLeaderboard":{"players":string;};}|{"SendPvpScore":{"pvp_score":I64;};});
export type ClientMessages=("Mine"|"UpgradeShovelAmount"|"UpgradeShovelDepth"|"StartAutomation"|"UpgradeAutomationDepth"|"UpgradeAutomationAmount"|"UpgradeAttackLevel"|"UpgradeDefenceLevel"|"GetLoginData"|"Treasure"|"Diamond"|"LoadGame");