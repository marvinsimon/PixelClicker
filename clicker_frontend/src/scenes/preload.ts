import Phaser from 'phaser';

export default class Preload extends Phaser.Scene {
    constructor() {
        super({key: 'Preload', active: true});
    }

    preload() {
        // Sprites......................................................................................................
        // Sky
        this.load.image('sky', "../assets/img/sky.png");

        // Dirt Background
        this.load.spritesheet('backgroundGrass', "../assets/img/dirt_background_grass.png", {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.spritesheet('ladderOnGrass', "../assets/img/dirt_background_ladder_grass.png", {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.spritesheet('backgroundDirt', "../assets/img/dirt_background.png", {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.spritesheet('ladderOnDirt', "../assets/img/dirt_background_ladder.png", {
            frameWidth: 64,
            frameHeight: 64
        });

        // Grass
        this.load.spritesheet('grass', "../assets/img/grass.png", {frameWidth: 64, frameHeight: 64});

        // Dirt
        this.load.spritesheet('dirt', "../assets/img/dirt.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('dirtCrack1', "../assets/img/dirt_cracked1.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('dirtCrack2', "../assets/img/dirt_cracked2.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('dirtCrack3', "../assets/img/dirt_cracked3.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('dirtCrack4', "../assets/img/dirt_cracked4.png", {frameWidth: 64, frameHeight: 64});

        // Support Bars
        this.load.spritesheet('barLeft', "../assets/img/barLeft.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('barRight', "../assets/img/barRight.png", {frameWidth: 64, frameHeight: 64});

        // Lava
        this.load.spritesheet('lava', "../assets/img/lava.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('lavaCrack1', "../assets/img/lava_cracked1.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('lavaCrack2', "../assets/img/lava_cracked2.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('lavaCrack3', "../assets/img/lava_cracked3.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('lavaCrack4', "../assets/img/lava_cracked4.png", {frameWidth: 64, frameHeight: 64});

        // Lava Background
        this.load.spritesheet('backgroundLava', "../assets/img/lava_background.png", {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.spritesheet('ladderOnLava', "../assets/img/lava_background_ladder.png", {
            frameWidth: 64,
            frameHeight: 64
        });

        // Sand
        this.load.spritesheet('sand', "../assets/img/sand.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('sandCrack1', "../assets/img/sand_cracked1.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('sandCrack2', "../assets/img/sand_cracked2.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('sandCrack3', "../assets/img/sand_cracked3.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('sandCrack4', "../assets/img/sand_cracked4.png", {frameWidth: 64, frameHeight: 64});

        // Sand Background
        this.load.spritesheet('backgroundSand', "../assets/img/sand_background.png", {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.spritesheet('ladderOnSand', "../assets/img/sand_background_ladder.png", {
            frameWidth: 64,
            frameHeight: 64
        });

        // Game objects
        this.load.spritesheet('bones1', "../assets/img/bones1.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('bones2', "../assets/img/bones2.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('bones3', "../assets/img/bones3.png", {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('diamond', "../assets/img/diamond2.png", {frameWidth: 64, frameHeight: 64});

        // Animations...................................................................................................
        // Idle
        this.load.spritesheet('idleAnimation', "../assets/img/idle.png", {frameWidth: 150, frameHeight: 150});
        // Mining
        this.load.spritesheet('miningAnimation', "../assets/img/mining.png", {
            frameWidth: 150,
            frameHeight: 150
        });
        this.load.image('debris', "../assets/img/rock1.png");
        // Drill
        this.load.spritesheet('drillAnimation', "../assets/img/drill_sprite2.png", {
            frameWidth: 142,
            frameHeight: 155
        });

        // Sounds.......................................................................................................
        // Dig
        this.load.audio('dig', "../assets/audio/pick2.mp3");
    }

    create() {
        // Go to play scene
        this.scene.start('Play');
    }
}