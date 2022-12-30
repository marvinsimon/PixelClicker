import Phaser from "phaser";
export default class ClickerRoyaleGame extends Phaser.Game {

    CONFIG: any;
    sound_on: boolean | undefined;
    depth: number | undefined;
    tileName: string | undefined;
    crackedTileName: string | undefined;
    backgroundTileName: string | undefined;
    pickedFirstDiamond: boolean | undefined;

    constructor(config: Phaser.Types.Core.GameConfig) {
        super(config);
    }
};