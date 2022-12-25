import Phaser from 'phaser';
import miner from "../assets/img/miner-animations_test2.png";
import dirtBackground from "../assets/img/dirt-background-tile64px.png";
import dirtTile from "../assets/img/dirt-tile64px.png";
import grassTile from "../assets/img/grassTile.png";
import grassTileDark from "../assets/img/grasTileDark.png"
import dirtTileBarLeft from "../assets/img/tileBarLeft.png";
import dirtTileBarRight from "../assets/img/tileBarRight.png";
import dirtTileGrassBarLeft from "../assets/img/tileGrassBarLeft.png";
import dirtTileBarGrassRight from "../assets/img/tileGrassBarRight.png";
import tileGrassLadder from "../assets/img/ladderGrass.png";
import tileLadder from "../assets/img/ladderDirt.png";
import testTile from "../assets/img/testTile.png";
import testTileLeft from "../assets/img/testTileLeft.png";
import testTileRight from "../assets/img/testTileRight.png";
import sky from "../assets/img/clouds.png";
import miner_sprite from "../assets/img/idle.png";
import debris from "../assets/img/rock1.png";
import mining from "../assets/img/mining_test2.png";
import dirtCrack1 from "../assets/img/cracked1.png";
import dirtCrack2 from "../assets/img/cracked2.png";
import dirtCrack3 from "../assets/img/cracked3.png";
import dirtCrack4 from "../assets/img/cracked4.png";
import bones from "../assets/img/bones.png";


export default class Preload extends Phaser.Scene {
    private CONFIG: any;
    private title!: Phaser.GameObjects.Text;
    private txt_progress!: Phaser.GameObjects.Text;
    private progress!: Phaser.GameObjects.Graphics;
    private border!: Phaser.GameObjects.Graphics;
    private w!: number;
    private h!: number;
    private bg!: Phaser.GameObjects.Graphics;
    constructor() {
        super({key: 'Preload', active: false});
    }

    init() {
        // @ts-ignore
        this.CONFIG = this.sys.game.CONFIG;
    }

    preload () {
        // Background
        this.bg = this.add.graphics({x: 0, y: 0});
        this.bg.fillStyle(0xF4CCA1, 1);
        this.bg.fillRect(0, 0, this.CONFIG.width, this.CONFIG.height);
        // Create loading bar
        this.createLoadingBar();
        // Spritesheets
        this.load.spritesheet('dirtBackgroundTile', dirtBackground, {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('dirtTile', dirtTile, {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('dirtCrack1', dirtCrack1, {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('dirtCrack2', dirtCrack2, {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('dirtCrack3', dirtCrack3, {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('dirtCrack4', dirtCrack4, {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('bones', bones, {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('grassTile', grassTile, {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('grassTileDark', grassTileDark, {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('dirtTileBarLeft', dirtTileBarLeft, {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('dirtTileBarRight', dirtTileBarRight, {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('dirtTileGrassBarLeft', dirtTileGrassBarLeft, {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('dirtTileGrassBarRight', dirtTileBarGrassRight, {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('tileGrassLadder', tileGrassLadder, {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('tileLadder', tileLadder, {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('testTile', testTile, {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('testTileLeft', testTileLeft, {frameWidth: 64, frameHeight: 64});
        this.load.spritesheet('testTileRight', testTileRight, {frameWidth: 64, frameHeight: 64});
        this.load.image('sky', sky);
        this.load.spritesheet('miner', miner_sprite, {frameWidth: 150, frameHeight:150});
        this.load.spritesheet('mining', mining, {frameWidth: 150, frameHeight:150});
        this.load.image('debris', debris);
    }

    create() {
        // Go menu
        this.scene.start('Play');
    }

    createLoadingBar() {
        // Title
        this.title = this.add.text(
            this.CONFIG.centerX,
            150,
            'Loading Game',
            {font: '70px Roboto', color: '#000000'}
        );
        this.title.setOrigin(0.5)
        this.title.setColor('#000000')
        // Progress Text
        this.txt_progress = this.add.text(
            this.CONFIG.centerX,
            this.CONFIG.centerY,
            "Loading...",
            {font: '50px Roboto', color: '#000000'}
        );
        this.txt_progress.setOrigin(0.5)
        this.txt_progress.setColor('#000000')
        // Progress bar
        let x = 10;
        let y = this.CONFIG.centerY + 40;
        this.w = this.CONFIG.width - 2*x;
        this.h = 30;
        this.progress = this.add.graphics({x: x, y: y});
        this.border = this.add.graphics({x: x, y: y});
        // Progress callback
        this.load.on('progress', this.onProgress, this);
    }

    onProgress (val: number) {
        // Width of bar
        this.progress?.clear();
        this.progress?.fillStyle(0x000000, 1);

        this.progress?.fillRect(0, 0, this.w * val, this.h);

        this.border?.clear();
        this.border?.lineStyle(4, 0x4D6592, 1);
        // @ts-ignore
        this.border?.strokeRect(0, 0, this.w * val, this.h);
        // Percentage in progress text
        this.txt_progress?.setText(Math.round(val * 100) + '%');
    }
}