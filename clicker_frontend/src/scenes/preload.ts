import Phaser from 'phaser';

export default class Preload extends Phaser.Scene {
    constructor() {
        super({key: 'Preload', active: true});
    }

    preload() {
        // Sprites......................................................................................................
        // Sky
        this.load.image('sky', "src/assets/img/sky.png");

        // Dirt Background
        this.load.spritesheet('backgroundGrass', "src/assets/img/dirt_background_grass.png", {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.spritesheet('ladderOnGrass', "src/assets/img/dirt_background_ladder_grass.png", {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.spritesheet('backgroundDirt', "src/assets/img/dirt_background.png", {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.spritesheet('ladderOnDirt', "src/assets/img/dirt_background_ladder.png", {
            frameWidth: 64,
            frameHeight: 64
        });

        // Grass
        this.load.spritesheet('grass', "src/assets/img/grass.png", {frameWidth: 64, frameHeight: 64});


        // Dirt
        this.load.spritesheet('dirt', "src/assets/img/dirt.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('dirtCrack1', "src/assets/img/dirt_cracked1.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('dirtCrack2', "src/assets/img/dirt_cracked2.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('dirtCrack3', "src/assets/img/dirt_cracked3.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('dirtCrack4', "src/assets/img/dirt_cracked4.png", {frameWidth: 64, frameHeight: 64});

        // Support Bars
        this.load.spritesheet('barLeft', "src/assets/img/barLeft.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('barRight', "src/assets/img/barRight.png", {frameWidth: 64, frameHeight: 64});

        // Lava
        this.load.spritesheet('lava', "src/assets/img/lava.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('lavaCrack1', "src/assets/img/lava_cracked1.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('lavaCrack2', "src/assets/img/lava_cracked2.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('lavaCrack3', "src/assets/img/lava_cracked3.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('lavaCrack4', "src/assets/img/lava_cracked4.png", {frameWidth: 64, frameHeight: 64});

        // Lava Background
        this.load.spritesheet('backgroundLava', "src/assets/img/lava_background.png", {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.spritesheet('ladderOnLava', "src/assets/img/lava_background_ladder.png", {
            frameWidth: 64,
            frameHeight: 64
        });

        // Sand
        this.load.spritesheet('sand', "src/assets/img/sand.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('sandCrack1', "src/assets/img/sand_cracked1.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('sandCrack2', "src/assets/img/sand_cracked2.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('sandCrack3', "src/assets/img/sand_cracked3.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('sandCrack4', "src/assets/img/sand_cracked4.png", {frameWidth: 64, frameHeight: 64});

        // Sand Background
        this.load.spritesheet('backgroundSand', "src/assets/img/sand_background.png", {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.spritesheet('ladderOnSand', "src/assets/img/sand_background_ladder.png", {
            frameWidth: 64,
            frameHeight: 64
        });

        // Game objects
        this.load.spritesheet('bones1', "src/assets/img/bones1.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('bones2', "src/assets/img/bones2.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('bones3', "src/assets/img/bones3.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('diamond', "src/assets/img/diamond2.png", {frameWidth: 64, frameHeight: 64});

        // Animations...................................................................................................
        // Idle
        this.load.spritesheet('idleAnimation', "src/assets/img/idle.png", {frameWidth: 150, frameHeight: 150});
        // Mining
        this.load.spritesheet('miningAnimation', "src/assets/img/mining.png", {
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