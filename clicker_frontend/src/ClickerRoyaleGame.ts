import Phaser from "phaser";

export default class ClickerRoyaleGame extends Phaser.Game {

    CONFIG: any;
    sound_on: boolean | undefined;
    depth!: number;
    tileName!: string | Phaser.Textures.Texture;
    crackedTileName!: string | Phaser.Textures.Texture;
    backgroundTileName!: string | Phaser.Textures.Texture;
    pickedFirstDiamond!: boolean;
    barRowCounter!: number;
    automation!: boolean;

    constructor(config: Phaser.Types.Core.GameConfig) {
        super(config);
    }
};