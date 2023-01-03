import Phaser from 'phaser';

export default class Preload extends Phaser.Scene {
    constructor() {
        super({key: 'Preload', active: true});
    }

    preload() {
        // Sprites......................................................................................................
        // Sky
        this.load.image('sky', "src/assets/img/newBG.png");

        // Background
        this.load.spritesheet('backgroundGrass', "src/assets/img/new_tile1_bg_dark.png", {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.spritesheet('ladderOnGrass', "src/assets/img/ladderGrass.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('backgroundDirt', "src/assets/img/new_tile3_big_dark.png", {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.spritesheet('ladderOnDirt', "src/assets/img/ladderDirt.png", {frameWidth: 64, frameHeight: 64});

        // Grass
        this.load.spritesheet('grass', "src/assets/img/new_tile1_big.png", {frameWidth: 64, frameHeight: 64});


        // Dirt
        this.load.spritesheet('dirt', "src/assets/img/new_tile2_big.png", {frameWidth: 64, frameHeight: 64});
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