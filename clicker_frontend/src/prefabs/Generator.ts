import Phaser from "phaser";

export default class Generator {
    private CONFIG: any;
    private DEPTH: {background: number, floor: number; miner: number};
    private ctx: Phaser.Scene;
    private readonly cols: number;
    private readonly rows: number;
    private layers: { background: any[]; floor: any[]; overlay: boolean; turrets: any[]; monsters: any[]; pickups: any[]};
    private sprite!: Phaser.Physics.Arcade.Sprite;
    private minerAnimation!: Phaser.Animations.Animation | false;
    private debris: any;
    private emitter!: Phaser.GameObjects.Particles.ParticleEmitter;
    private IntegerBetween = Phaser.Math.Between;
    private triggerLeft = true;
    private triggerRight = true;

    constructor(ctx: Phaser.Scene) {
        // @ts-ignore
        this.CONFIG = ctx.CONFIG;
        // @ts-ignore
        this.DEPTH = ctx.DEPTH;

        this.ctx = ctx;

        this.cols = 16;
        this.rows = 13;

        this.layers = {
            background: [],
            floor: [],
            monsters: [],
            pickups: [],
            turrets: [],
            overlay: false
        };
    }

    setup() {
        this.createBackground();
        this.createFloor();
        this.createSky();

        this.sprite = this.ctx.physics.add.sprite(500, 540, 'miner');
        this.sprite.setOrigin(0.5, 0);
        this.sprite.setBounce(0.1);
        this.sprite.setDepth(this.DEPTH.miner);
        this.sprite.body.setSize(45, 35);
        this.ctx.cameras.main.startFollow(this.sprite);
        this.ctx.cameras.main.followOffset.set(0, 110);
        // Create the debris
        this.debris = this.ctx.add.particles('debris');
        this.debris.setDepth(2);


        this.ctx.input.on('pointerup', () => {
            // Set up the debris to emit debris
            this.emitter = this.debris.createEmitter({
                x: this.IntegerBetween(this.sprite.x + 20, this.sprite.x -20),
                y: this.sprite.y + 150,
                lifespan: 2000,
                speed: {min: 300, max: 500},
                scale: {start: 0.15, end: 0.1},
                gravityY: 1000,
                bounce: 0.8,
            });
            this.createSupportBarsLeft();
            this.createSupportBarsRight();
            this.destroyFloorRow();
            this.appendFloorRow();
            setTimeout(() => {
                this.ctx.physics.add.collider(this.sprite, this.layers.floor[0]);
                this.emitter.stop()
            }, 20);
        });

        this.minerAnimation = this.ctx.anims.create({
            key: 'mine',
            //@ts-ignore
            frames: this.ctx.anims.generateFrameNumbers('miner'),
            frameRate: 24
        });

    }

    // Update
    update() {
        this.ctx.physics.add.collider(this.sprite, this.layers.floor[0]);
        this.scrollBackGround();
        this.scrollSideFloor();
        this.ctx.input.on('pointerdown', () => {
            // @ts-ignore
            this.sprite.play({key: 'mine'});
        });
    }

    createSupportBarsLeft() {
        let spr;
        if (this.layers.floor[0][0].texture.key == 'testTile') {

            spr = this.ctx.add.sprite(this.layers.floor[0][3].x, this.layers.floor[0][0].y, 'testTileLeft');
        } else {
            if (this.triggerLeft) {
                spr = this.ctx.add.sprite(this.layers.floor[0][3].x, this.layers.floor[0][0].y, 'dirtTileGrassBarLeft');
                this.triggerLeft = false;
            } else {
                spr = this.ctx.add.sprite(this.layers.floor[0][3].x, this.layers.floor[0][0].y, 'dirtTileBarLeft');
            }
        }
        spr.setOrigin(0);
        spr.setDepth(this.DEPTH.floor);
        this.layers.floor[0][3].destroy();
        this.layers.floor[0][3] = spr;
    }

    createSupportBarsRight() {
        let spr;
        if (this.layers.floor[0][0].texture.key == 'testTile') {
            spr = this.ctx.add.sprite(this.layers.floor[0][12].x, this.layers.floor[0][0].y, 'testTileRight');
        } else {
            if (this.triggerRight) {
                spr = this.ctx.add.sprite(this.layers.floor[0][12].x, this.layers.floor[0][0].y, 'dirtTileGrassBarRight');
                this.triggerRight = false;
            } else {
                spr = this.ctx.add.sprite(this.layers.floor[0][12].x, this.layers.floor[0][0].y, 'dirtTileBarRight');
            }
        }
        spr.setOrigin(0);
        spr.setDepth(this.DEPTH.floor);
        this.layers.floor[0][12].destroy();
        this.layers.floor[0][12] = spr;
    }

    // Background Layer
    createBackground() {
        let x;
        let y;
        let spr;

        // Draw bigger than camera view height
        let cols = this.cols;
        let rows = this.rows + 1;

        // Save tiles in array
        let background = [];

        // Loop cols & rows
        for (let ty = 0; ty < rows; ty++) {
            background[ty] = [];
            for (let tx = 0; tx < cols; tx++) {
                x = (tx * this.CONFIG.tile);
                y = (ty * this.CONFIG.tile);

                if (ty == 10) {
                    if (tx == 9) {
                        spr = this.ctx.add.sprite(x, y, 'tileGrassLadder');
                        spr.setOrigin(0);
                        spr.setDepth(this.DEPTH.background);
                    } else {
                        spr = this.ctx.add.sprite(x, y, 'grassTileDark');
                        spr.setOrigin(0);
                        spr.setDepth(this.DEPTH.background);
                    }
                } else {
                    if (tx == 9) {
                        spr = this.ctx.add.sprite(x, y, 'tileLadder');
                        spr.setOrigin(0);
                        spr.setDepth(this.DEPTH.background);
                    } else {
                        spr = this.ctx.add.sprite(x, y, 'dirtBackgroundTile');
                        spr.setOrigin(0);
                        spr.setDepth(this.DEPTH.background);
                    }
                }

                // @ts-ignore
                background[ty][tx] = spr;
            }
        }

        // Save background array in generator layers
        this.layers.background = background;
    }

    scrollBackGround() {
        let offset = this.ctx.cameras.main.scrollY - this.layers.background[0][0].y;

        if (offset >= this.CONFIG.tile) {
            this.destroyBackgroundRow();
            this.appendBackgroundRow();
        }
    }

    scrollSideFloor() {
        let offset = this.ctx.cameras.main.scrollY - this.layers.floor[0][0].y;

        if (offset >= this.CONFIG.tile) {
            this.destroySideFloorRow();
        }
    }

    destroyBackgroundRow() {
        for (let tx = 0; tx < this.layers.background[0].length; tx++) {
            this.layers.background[0][tx].destroy();
        }
        this.layers.background.splice(0, 1);
    }

    destroySideFloorRow() {
        for (let tx = 0; tx < this.layers.floor[0].length; tx++) {
            this.layers.floor[0][tx].destroy();
        }
        this.layers.floor.splice(0, 1);
    }

    appendBackgroundRow() {
        let x;
        let spr;

        // Row at the end of the background, right below camera edge
        let ty = this.layers.background.length;
        let y = this.layers.background[ty - 1][0].y + this.CONFIG.tile;

        // Add empty row to the floor layer
        this.layers.background.push([]);

        // Draw tiles on this row
        for (let tx = 0; tx < this.cols; tx++) {
            x = (tx * this.CONFIG.tile);

            if (tx == 9) {
                spr = this.ctx.add.sprite(x, y, 'tileLadder');
                spr.setOrigin(0);
                spr.setDepth(this.DEPTH.background);
            } else {
                spr = this.ctx.add.sprite(x, y, 'dirtBackgroundTile');
                spr.setOrigin(0);
                spr.setDepth(this.DEPTH.background);
            }

            this.layers.background[ty][tx] = spr;
        }
    }

    createSky() {
        this.ctx.add.image(0, 0, 'sky').setOrigin(0);
    }

    // Floor Layer
    createFloor() {
        let x;
        let y;
        let spr;

        // Draw bigger than camera view height
        let cols = this.cols;
        let rows = 5;

        // Save tiles in array
        let floor = [];

        // Loop cols & rows
        for (let ty = 0; ty < rows; ty++) {
            floor[ty] = [];
            for (let tx = 0; tx < cols; tx++) {
                x = (tx * this.CONFIG.tile);
                y = ((ty + 10) * this.CONFIG.tile);

                if (ty == 0) {
                    spr = this.ctx.physics.add.staticSprite(x, y, 'grassTile');
                    spr.setOrigin(0);
                    spr.setDepth(this.DEPTH.floor);
                } else {
                    spr = this.ctx.physics.add.staticSprite(x, y, 'dirtTile');
                    spr.setOrigin(0);
                    spr.setDepth(this.DEPTH.floor);
                }
                // @ts-ignore
                floor[ty][tx] = spr;
            }
        }

        // Save floor array in generator layers
        this.layers.floor = floor;
    }

    destroyFloorRow() {
        for (let tx = 4; tx < 12; tx++) {
            this.layers.floor[0][tx].destroy();
        }
        this.layers.floor.splice(0, 1);
    }

    appendFloorRow() {
        let x;
        let spr;

        // Row at the end of the floor, right below camera edge
        let ty = this.layers.floor.length;
        let y = this.layers.floor[ty - 1][0].y + this.CONFIG.tile;

        // Add empty row to the floor layer
        this.layers.floor.push([]);

        // Draw tiles on this row
        for (let tx = 0; tx < this.cols; tx++) {
            x = (tx * this.CONFIG.tile);

            // @ts-ignore
            if (this.ctx.depth >= 100) {
                spr = this.ctx.physics.add.staticSprite(x, y, 'testTile');
                spr.setOrigin(0);
                spr.setDepth(this.DEPTH.floor);
            } else {
                spr = this.ctx.physics.add.staticSprite(x, y, 'dirtTile');
                spr.setOrigin(0);
                spr.setDepth(this.DEPTH.floor);
            }
            this.layers.floor[ty][tx] = spr;
        }
    }
}