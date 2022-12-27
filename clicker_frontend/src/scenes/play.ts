import Phaser from 'phaser';
import Generator from "../prefabs/Generator";

export default class Play extends Phaser.Scene {
    private CONFIG: any;
    private depth!: number;
    private PRIORITY!: { sky: number; background: number, floor: number; miner: number; objects: number; debris: number };
    private allow_input!: boolean;
    private is_pause!: boolean;
    private is_gameOver!: boolean;
    private generator!: Generator;
    constructor() {
        super({key: 'Play', active: false});
    }

    init() {
        // @ts-ignore
        this.CONFIG = this.sys.game.CONFIG;

        this.PRIORITY = {
            sky: 2,
            background: 0,
            floor: 2,
            miner: 4,
            objects: 3,
            debris: 1,
        };

        this.generator = new Generator(this);
        // Main flags
        this.allow_input = false;
        this.is_pause = false;
        this.is_gameOver = false;
    }

    create() {
        // Create floor
        this.generator.setup();
    }

    update() {
        this.generator.update();
        // @ts-ignore
        this.depth = this.sys.game.depth;
    }
}