import Phaser from 'phaser';

export default class Preload extends Phaser.Scene {
    private CONFIG: any;
    private bg!: Phaser.GameObjects.Graphics;

    constructor() {
        super({key: 'Preload', active: true});
    }

    init() {
        // @ts-ignore
        this.CONFIG = this.sys.game.CONFIG;
    }

    preload() {
        // Sprites......................................................................................................
        // Sky
        this.load.image('sky', "src/assets/img/bg1.png");

        // Background
        this.load.spritesheet('backgroundGrass', "src/assets/img/grasTileDark.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('ladderOnGrass', "src/assets/img/ladderGrass.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('backgroundDirt', "src/assets/img/tile_3.png", {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.spritesheet('ladderOnDirt', "src/assets/img/ladderDirt.png", {frameWidth: 64, frameHeight: 64});

        // Grass
        this.load.spritesheet('grass', "src/assets/img/tile_1.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('barOnGrassLeft', "src/assets/img/tileGrassBarLeft.png", {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.spritesheet('barOnGrassRight', "src/assets/img/tileGrassBarRight.png", {
            frameWidth: 64,
            frameHeight: 64
        });

        // Dirt
        this.load.spritesheet('dirt', "src/assets/img/tile_2.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('dirtCrack1', "src/assets/img/cracked1.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('dirtCrack2', "src/assets/img/cracked2.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('dirtCrack3', "src/assets/img/cracked3.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('dirtCrack4', "src/assets/img/cracked4.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('barOnDirtLeft', "src/assets/img/barLeft.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('barOnDirtRight', "src/assets/img/barRight.png", {frameWidth: 64, frameHeight: 64});

        // Lava
        this.load.spritesheet('lava', "src/assets/img/testTile.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('lavaCrack1', "src/assets/img/testCracked1.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('lavaCrack2', "src/assets/img/testCracked2.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('lavaCrack3', "src/assets/img/testCracked3.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('lavaCrack4', "src/assets/img/testCracked4.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('barOnLavaLeft', "src/assets/img/testTileLeft.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('barOnLavaRight', "src/assets/img/testTileRight.png", {frameWidth: 64, frameHeight: 64});

        // Game objects
        this.load.spritesheet('bones1', "src/assets/img/bones1.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('bones2', "src/assets/img/bones2.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('bones3', "src/assets/img/bones3.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('diamond', "src/assets/img/diamond2.png", {frameWidth: 64, frameHeight: 64});

        // Animations...................................................................................................
        // Idle
        this.load.spritesheet('idleAnimation', "src/assets/img/idle.png", {frameWidth: 150, frameHeight: 150});
        // Mining
        this.load.spritesheet('miningAnimation', "src/assets/img/mining_test2.png", {
            frameWidth: 150,
            frameHeight: 150
        });
        this.load.image('debris', "src/assets/img/rock1.png");

        // Sounds.......................................................................................................
        // Dig
        this.load.audio('dig', "src/assets/audio/pick2.mp3");
    }

    create() {
        // Go to play scene
        this.scene.start('Play');
    }
}