import Phaser from 'phaser';
import sky from "../assets/img/sky.png";
import dirt_background_grass from "../assets/img/dirt_background_grass.png";
import dirt_background_ladder_grass from "../assets/img/dirt_background_ladder_grass.png";
import dirt_background from "../assets/img/dirt_background.png";
import dirt_background_ladder from "../assets/img/dirt_background_ladder.png";
import grass from "../assets/img/grass.png";
import dirt from "../assets/img/dirt.png";
import dirt_cracked1 from "../assets/img/dirt_cracked1.png";
import dirt_cracked2 from "../assets/img/dirt_cracked2.png";
import dirt_cracked3 from "../assets/img/dirt_cracked3.png";
import dirt_cracked4 from "../assets/img/dirt_cracked4.png";
import barLeft from "../assets/img/barLeft.png";
import barRight from "../assets/img/barRight.png";
import lava from "../assets/img/lava.png";
import lava_cracked1 from "../assets/img/lava_cracked1.png";
import lava_cracked2 from "../assets/img/lava_cracked2.png";
import lava_cracked3 from "../assets/img/lava_cracked3.png";
import lava_cracked4 from "../assets/img/lava_cracked4.png";
import lava_background from "../assets/img/lava_background.png";
import lava_background_ladder from "../assets/img/lava_background_ladder.png";
import sand from "../assets/img/sand.png";
import sand_cracked1 from "../assets/img/sand_cracked1.png";
import sand_cracked2 from "../assets/img/sand_cracked2.png";
import sand_cracked3 from "../assets/img/sand_cracked3.png";
import sand_cracked4 from "../assets/img/sand_cracked4.png";

import sand_background from "../assets/img/sand_background.png";
import sand_background_ladder from "../assets/img/sand_background_ladder.png";

import bones1 from "../assets/img/bones1.png";
import bones2 from "../assets/img/bones2.png";
import bones3 from "../assets/img/bones3.png";


import diamond2 from "../assets/img/diamond2.png";
import idle from "../assets/img/idle.png";

import mining from "../assets/img/mining.png";
import rock1 from "../assets/img/rock1.png";
import drill_sprite2 from "../assets/img/drill_sprite2.png";
import pick2 from "../assets/audio/pick2.mp3";

export default class Preload extends Phaser.Scene {
    constructor() {
        super({key: 'Preload', active: true});
    }

    preload() {
        // Sprites......................................................................................................
        // Sky
        this.load.image('sky', sky);

        // Dirt Background
        this.load.spritesheet('backgroundGrass', dirt_background_grass, {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.spritesheet('ladderOnGrass', dirt_background_ladder_grass, {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.spritesheet('backgroundDirt', dirt_background, {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.spritesheet('ladderOnDirt', dirt_background_ladder, {
            frameWidth: 64,
            frameHeight: 64
        });

        // Grass
        this.load.spritesheet('grass', grass, {frameWidth: 64, frameHeight: 64});

        // Dirt
        this.load.spritesheet('dirt', dirt, {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('dirtCrack1', dirt_cracked1, {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('dirtCrack2', dirt_cracked2, {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('dirtCrack3', dirt_cracked3, {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('dirtCrack4', dirt_cracked4, {frameWidth: 64, frameHeight: 64});

        // Support Bars
        this.load.spritesheet('barLeft', barLeft, {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('barRight', barRight, {frameWidth: 64, frameHeight: 64});

        // Lava
        this.load.spritesheet('lava', lava, {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('lavaCrack1', lava_cracked1, {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('lavaCrack2', lava_cracked2, {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('lavaCrack3', lava_cracked3, {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('lavaCrack4', lava_cracked4, {frameWidth: 64, frameHeight: 64});

        // Lava Background
        this.load.spritesheet('backgroundLava', lava_background, {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.spritesheet('ladderOnLava', lava_background_ladder, {
            frameWidth: 64,
            frameHeight: 64
        });

        // Sand
        this.load.spritesheet('sand', sand, {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('sandCrack1', sand_cracked1, {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('sandCrack2', sand_cracked2, {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('sandCrack3', sand_cracked3, {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('sandCrack4', sand_cracked4, {frameWidth: 64, frameHeight: 64});

        // Sand Background
        this.load.spritesheet('backgroundSand', sand_background, {
            frameWidth: 64,
            frameHeight: 64
        });
        this.load.spritesheet('ladderOnSand', sand_background_ladder, {
            frameWidth: 64,
            frameHeight: 64
        });

        // Game objects
        this.load.spritesheet('bones1', bones1, {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('bones2', bones2, {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('bones3', bones3, {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('diamond', diamond2, {frameWidth: 64, frameHeight: 64});

        // Animations...................................................................................................
        // Idle
        this.load.spritesheet('idleAnimation', idle, {frameWidth: 150, frameHeight: 150});
        // Mining
        this.load.spritesheet('miningAnimation', mining, {
            frameWidth: 150,
            frameHeight: 150
        });
        this.load.image('debris', rock1);
        // Drill
        this.load.spritesheet('drillAnimation', drill_sprite2, {
            frameWidth: 142,
            frameHeight: 155
        });

        // Sounds.......................................................................................................
        // Dig
        this.load.audio('dig', pick2);
    }

    create() {
        // Go to play scene
        this.scene.start('Play');
    }
}