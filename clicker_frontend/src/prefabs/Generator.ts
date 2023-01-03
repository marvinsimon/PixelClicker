import Phaser from "phaser";
import Play from "../scenes/play";
import ClickerRoyaleGame from "../ClickerRoyaleGame";

export default class Generator {
    private CONFIG: any;
    private PRIORITY: { sky: number; background: number, floor: number; miner: number; objects: number; debris: number };
    private scene: Play;
    private readonly cols: number;
    private readonly rows: number;
    private layers: { background: any[]; floor: any[]; sideFloor: any[]; supportBars: any[]; pickups: any[] };
    private sky!: Phaser.GameObjects.Image;
    private miner!: Phaser.Physics.Arcade.Sprite;
    private debris!: Phaser.GameObjects.Particles.ParticleEmitterManager;
    private emitter!: Phaser.GameObjects.Particles.ParticleEmitter;
    private tileName: string | Phaser.Textures.Texture = 'dirt';
    private crackedTileName: string | Phaser.Textures.Texture = 'dirtCrack';
    private backgroundTileName: string | Phaser.Textures.Texture = 'backgroundDirt';
    private cursorkeys!: Phaser.Types.Input.Keyboard.CursorKeys;
    private barRowCounter = 0;
    private breakCounter = 0;
    private start: any;
    private sound!: Phaser.Sound.BaseSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound;
    private diamond: number = 1;
    private pickedFirstDiamond: boolean = false;
    private collision!: Phaser.Physics.Arcade.Collider;
    private gameInstance: ClickerRoyaleGame;

    constructor(scene: Play) {
        this.CONFIG = scene.CONFIG;
        this.PRIORITY = scene.PRIORITY;

        this.scene = scene;

        this.gameInstance = Play.gameInstance;
        this.cols = 16;
        this.rows = 13;

        this.layers = {
            background: [],
            floor: [],
            sideFloor: [],
            supportBars: [],
            pickups: [],
        };
    }

    setup() {
        // Disable all input while loading game
        this.gameInstance.input.enabled = false;

        // Create tiles
        this.createSky();
        this.createBackground();
        this.createFloor();
        this.createSideFloor();

        // Check depth to match tiles with depth
        this.checkDepth(this.scene.depth);
        this.start = this.layers.floor[0][4].y;

        // Create Miner
        this.miner = this.scene.physics.add.sprite(500, 360, 'idleAnimation');
        this.miner.setScale(3, 3);
        this.miner.setOrigin(0.5, 0);
        this.miner.setBounce(0.1);
        this.miner.setDepth(this.PRIORITY.miner);
        this.miner.body.setSize(45, 18);

        // Camera
        this.scene.cameras.main.startFollow(this.miner);
        this.scene.cameras.main.followOffset.set(0, -70);

        // Create debris
        this.debris = this.scene.add.particles('debris');
        this.debris.setDepth(this.PRIORITY.debris);

        // Set up the debris to emit debris
        this.emitter = this.debris.createEmitter({
            x: 0,
            y: 0,
            lifespan: 2000,
            speed: {min: 300, max: 500},
            scale: {start: 0.15, end: 0.08},
            gravityY: 1000,
            bounce: 0.8,
            on: false,
        });

        // On click event --> Mining
        this.scene.input.on('pointerdown', () => {
            // Dispatch event to solid
            let mineEvent = new CustomEvent('mineEvent');
            window.dispatchEvent(mineEvent);
            // Play mining animation
            if (this.miner.anims.getName() === 'idle') {
                this.miner.play('mining');
                this.miner.chain('idle');
            }
            // Play dig sound
            if (!this.sound.isPlaying) {
                this.sound.play();
            }
            // Create cracks in floor and destroy floor row on 5th click
            if (this.breakCounter < 4) {
                this.crackFloorRow();
                this.breakCounter++;
            } else {
                this.createSupportBars(10, 10, this.barRowCounter);
                this.destroyFloor();
                this.collision.destroy();
                this.collision = this.scene.physics.add.collider(this.miner, this.layers.floor[0]);
                this.destroyPickups();
                this.breakCounter = 0;
            }
        });

        // Create support bars to match tiles when logging in & destroy sky
        if (this.scene.loggedIn) {
            this.pickedFirstDiamond = this.gameInstance.pickedFirstDiamond;
            this.barRowCounter = Math.floor(this.scene.depth / 5 < 10 ? this.scene.depth / 5 : 10);
            console.log('Bar Counter: ', this.barRowCounter);
            for (let i = 0; i < 10 && i < Math.floor(this.scene.depth / 5); i++) {
                // this.checkDepth(this.scene.depth);
                this.destroyFloor();
                this.destroyPickups();
                this.scrollFloor();
                setTimeout(() => {
                    this.createSupportBars(i, (10 - this.barRowCounter) + i, i);
                    this.barRowCounter--;
                }, 900);
            }
            setTimeout(() => {
                this.breakCounter = this.scene.depth % 5;
                if (this.breakCounter != 0 && this.breakCounter <= 4) {
                    this.breakCounter--;
                    this.crackFloorRow();
                    this.breakCounter++;
                }
            }, 800);
        }

        // Add collision between miner and the first floor layer
        this.collision = this.scene.physics.add.collider(this.miner, this.layers.floor[0]);

        this.cursorkeys = this.scene.input.keyboard.createCursorKeys();

        // Create mining animation
        this.scene.anims.create({
            key: 'mining',
            frames: this.scene.anims.generateFrameNumbers('miningAnimation', {start: 0, end: 4}),
            frameRate: 15
        });

        // Create idle animation
        this.scene.anims.create({
            key: 'idle',
            frames: this.scene.anims.generateFrameNumbers('idleAnimation', {start: 0, end: 7}),
            frameRate: 6,
            repeat: -1
        });

        // Play idle animation on game start
        this.miner.play({key: 'idle'});

        // Create dig sound
        this.sound = this.scene.sound.add('dig');

        // Enable input after some time, guarantying load is finished
        setTimeout(() => {
            this.gameInstance.input.enabled = true;
        }, 1000);
    }

    // Update
    update() {
        this.checkDepth(this.scene.depth);

        if (this.cursorkeys.space.isDown) {
            this.miner.setY(this.miner.y - 10);
        }
        this.scrollBackGround();
        this.scrollSideFloor();
        this.scrollSupportBars();
        this.destroySky();
        this.scrollFloor();
    }

    // Create sky
    createSky() {
        this.sky = this.scene.add.image(0, 0, 'sky').setOrigin(0).setDepth(this.PRIORITY.sky);
    }

    // Background layer
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

                if (ty == 10 && !this.scene.loggedIn) {
                    if (tx == 9) {
                        spr = this.scene.add.sprite(x, y, 'ladderOnGrass');
                    } else {
                        spr = this.scene.add.sprite(x, y, 'backgroundGrass');
                    }
                } else {
                    if (tx == 9) {
                        spr = this.scene.add.sprite(x, y, 'ladderOnDirt');
                    } else {
                        spr = this.scene.add.sprite(x, y, this.backgroundTileName);
                    }
                }
                spr.setOrigin(0);
                spr.setDepth(this.PRIORITY.background);
                // @ts-ignore
                background[ty][tx] = spr;
            }
        }

        // Save background array in generator layers
        this.layers.background = background;
    }

    // Floor layer
    createFloor() {
        let x;
        let y;
        let spr;

        let rows = 4;
        let cols = 12;

        // Save tiles in array
        let floor = [];

        // Loop cols & rows
        for (let ty = 0; ty < rows; ty++) {
            floor[ty] = [];
            for (let tx = 4; tx < cols; tx++) {
                x = (tx * this.CONFIG.tile);
                y = ((ty + 10) * this.CONFIG.tile);
                if (ty == 0 && !this.scene.loggedIn) {
                    spr = this.scene.physics.add.staticSprite(x, y, 'grass');
                } else {
                    spr = this.scene.physics.add.staticSprite(x, y, this.tileName);
                }
                spr?.setOrigin(0);
                spr?.setDepth(this.PRIORITY.floor);
                // @ts-ignore
                floor[ty][tx] = spr;
            }
        }
        // Save floor array in generator layers
        this.layers.floor = floor;
    }

    // Side floor layer
    createSideFloor() {
        let x;
        let y;
        let spr;

        // Draw bigger than camera view height
        let cols = this.cols;
        let rows = this.rows + 1;

        // Save tiles in array
        let sideFloor = [];

        // Loop cols & rows
        for (let ty = 0; ty < rows; ty++) {
            sideFloor[ty] = [];
            for (let tx = 0; tx < cols; tx++) {
                x = (tx * this.CONFIG.tile);
                y = (ty * this.CONFIG.tile);
                if (tx < 4 || tx > 11) {
                    if (ty == 10 && !this.scene.loggedIn) {
                        spr = this.scene.add.sprite(x, y, 'grass');
                    } else {
                        spr = this.scene.add.sprite(x, y, this.tileName);
                    }
                }
                spr?.setOrigin(0);
                spr?.setDepth(this.PRIORITY.background);
                // @ts-ignore
                sideFloor[ty][tx] = spr;
            }
        }
        // Save floor array in generator layers
        this.layers.sideFloor = sideFloor;
    }

    // Create support bars
    createSupportBars(x: number, y: number, counter: number) {
        let leftSpr;
        let rightSpr;

        let bars = [];
        leftSpr = this.scene.add.sprite(this.layers.sideFloor[x][3].x, this.layers.sideFloor[y][4].y, 'barOnDirtLeft');
        leftSpr.setOrigin(0);
        leftSpr.setDepth(this.PRIORITY.objects);

        rightSpr = this.scene.add.sprite(this.layers.sideFloor[x][12].x, this.layers.sideFloor[y][4].y, 'barOnDirtRight');
        rightSpr.setOrigin(0);
        rightSpr.setDepth(this.PRIORITY.objects);

        bars.push(leftSpr);
        bars.push(rightSpr);

        this.layers.supportBars[counter] = bars;
        this.barRowCounter++;
    }

    scrollBackGround() {
        let offset = this.scene.cameras.main.scrollY - this.layers.background[0][0].y;

        if (offset >= this.CONFIG.tile) {
            this.destroyBackgroundRow();
            this.appendBackgroundRow();
        }
    }

    scrollFloor() {
        let newStart = this.layers.floor[0][4].y;
        if (this.start <= newStart - this.CONFIG.tile) {
            this.start = this.layers.floor[0][4].y;
            this.appendFloorRow();
        }
    }

    scrollSideFloor() {
        let offset = this.scene.cameras.main.scrollY - this.layers.sideFloor[0][0].y;

        if (offset >= this.CONFIG.tile) {
            this.destroySideFloor();
            this.appendSideFloorRow();
        }
    }

    scrollSupportBars() {
        if (this.barRowCounter == 12) {
            this.destroyBars();
            this.barRowCounter--;
        }
    }

    destroySky() {
        if (this.sky.y + this.sky.height < this.scene.cameras.main.scrollY) {
            this.sky.destroy();
        }
    }

    destroyBackgroundRow() {
        for (let tx = 0; tx < this.layers.background[0].length; tx++) {
            this.layers.background[0][tx].destroy();
        }
        this.layers.background.splice(0, 1);
    }

    destroyFloor() {
        for (let tx = 4; tx < 12; tx++) {
            this.debris.emitParticleAt(this.layers.floor[0][tx].x + (this.CONFIG.tile / 2), this.layers.floor[0][tx].y, 3);
            this.layers.floor[0][tx].destroy();
        }
        this.layers.floor.splice(0, 1);
    }

    destroySideFloor() {
        for (let tx = 0; tx < this.layers.sideFloor[0].length; tx++) {
            this.layers.sideFloor[0][tx].destroy();
        }
        this.layers.sideFloor.splice(0, 1);
    }

    destroyBars() {
        this.layers.supportBars[0][0].destroy();
        this.layers.supportBars[0][1].destroy();
        this.layers.supportBars.splice(0, 1);
    }

    destroyPickups() {
        this.layers.pickups.forEach(sprite => {
            if (sprite.getBounds().y - this.scene.cameras.main.scrollY <= -this.CONFIG.tile) {
                sprite.destroy();
            }
        });
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
                spr = this.scene.add.sprite(x, y, 'ladderOnDirt');
            } else {
                spr = this.scene.add.sprite(x, y, this.backgroundTileName);
            }
            spr.setOrigin(0);
            spr.setDepth(this.PRIORITY.background);
            this.layers.background[ty][tx] = spr;
        }
    }

    appendFloorRow() {
        let x;
        let spr;

        // Row at the end of the floor, right below camera edge
        let ty = this.layers.floor.length;
        let y = this.layers.floor[ty - 1][4].y + this.CONFIG.tile;

        // Add empty row to the floor layer
        this.layers.floor.push([]);

        // Draw tiles on this row
        for (let tx = 4; tx < 12; tx++) {
            x = (tx * this.CONFIG.tile);

            spr = this.scene.physics.add.staticSprite(x, y, this.tileName);

            spr?.setOrigin(0);
            spr?.setDepth(this.PRIORITY.floor);
            this.layers.floor[ty][tx] = spr;
        }
    }

    appendSideFloorRow() {
        let x;
        let spr;

        // Row at the end of the floor, right below camera edge
        let ty = this.layers.sideFloor.length;
        let y = this.layers.sideFloor[ty - 1][0].y + this.CONFIG.tile;

        // Add empty row to the floor layer
        this.layers.sideFloor.push([]);

        // Draw tiles on this row
        for (let tx = 0; tx < this.cols; tx++) {
            x = (tx * this.CONFIG.tile);

            if (tx < 4 || tx > 11) {
                this.appendPickups(x, y);
                spr = this.scene.add.sprite(x, y, this.tileName);
            }
            spr?.setOrigin(0);
            spr?.setDepth(this.PRIORITY.floor);
            this.layers.sideFloor[ty][tx] = spr;
        }
    }

    appendPickups(x: number, y: number) {
        let spr;
        let randomBones = 80;
        let pointer = this.scene.input.mousePointer;
        if (this.pickedFirstDiamond) {
            this.diamond = Math.floor(Math.random() * (100 - 1 + 1)) + 1;
        }
        if (this.scene.depth >= 20 && this.diamond == 1) {
            this.diamond = Math.floor(Math.random() * (100 - 1 + 1)) + 1;
            console.log('Create Diamond');
            spr = this.scene.add.sprite(x, y, 'diamond');
            spr.setInteractive({useHandCursor: true});
            spr.on('pointerdown', (event: any) => {
                this.pickedFirstDiamond = true;
                let diamondEvent = new CustomEvent('diamondEvent');
                window.dispatchEvent(diamondEvent);

                this.layers.pickups.forEach(sprite => {
                    if (sprite.getBounds().contains(pointer.x, pointer.y + this.scene.cameras.main.scrollY)) {
                        sprite.destroy();
                    }
                });
                event.stopImmediatePropagation();
            });
        } else if (Math.floor(Math.random() * (randomBones - 1 + 1)) + 1 === 10) {
            spr = this.scene.add.sprite(x, y, 'bones1');
            spr.setInteractive({useHandCursor: true});
            spr.on('pointerdown', (event: any) => {
                let treasureEvent = new CustomEvent('treasureEvent');
                window.dispatchEvent(treasureEvent);

                this.layers.pickups.forEach(sprite => {
                    if (sprite.getBounds().contains(pointer.x, pointer.y + this.scene.cameras.main.scrollY)) {
                        sprite.destroy();
                    }
                });
                event.stopImmediatePropagation();
            });
        } else if (Math.floor(Math.random() * (randomBones - 1 + 1)) + 1 === 30) {
            spr = this.scene.add.sprite(x, y, 'bones2');
        } else if (Math.floor(Math.random() * (randomBones - 1 + 1)) + 1 === 50) {
            spr = this.scene.add.sprite(x, y, 'bones3');
        }
        if (spr != null) {
            spr.setOrigin(0);
            spr.setDepth(this.PRIORITY.objects);
            this.layers.pickups.push(spr);
        }
    }

    crackFloorRow() {
        let spr;
        for (let tx = 4; tx < 12; tx++) {
            switch (this.breakCounter) {
                case 0:
                    spr = this.scene.physics.add.staticSprite(this.layers.floor[0][tx].x, this.layers.floor[0][tx].y, this.crackedTileName + '1');
                    break;
                case 1:
                    spr = this.scene.physics.add.staticSprite(this.layers.floor[0][tx].x, this.layers.floor[0][tx].y, this.crackedTileName + '2');
                    break;
                case 2:
                    spr = this.scene.physics.add.staticSprite(this.layers.floor[0][tx].x, this.layers.floor[0][tx].y, this.crackedTileName + '3');
                    break;
                case 3:
                    spr = this.scene.physics.add.staticSprite(this.layers.floor[0][tx].x, this.layers.floor[0][tx].y, this.crackedTileName + '4');
                    break;
            }
            spr?.setOrigin(0);
            spr?.setDepth(this.PRIORITY.floor);
            this.layers.floor[0][tx].destroy();
            this.layers.floor[0][tx] = spr;
        }
    }

    checkDepth(value: number) {
        if (value == undefined) {
            value = 1;
        }
        switch (true) {
            case (value <= 50):
                this.tileName = 'dirt';
                this.crackedTileName = 'dirtCrack';
                this.backgroundTileName = 'backgroundDirt'
                break;
            case (value > 51):
                this.tileName = 'lava';
                if (this.layers.sideFloor[10][0].texture.key == 'lava') {
                    this.crackedTileName = 'lavaCrack';
                }
                break;
        }
    }
}