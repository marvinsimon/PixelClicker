import miner_sprite from "./assets/miner-animations_test2.png";
import sky from "./assets/clouds.png";
import tiles from "./assets/fantasy-tiles.png";
import Phaser from 'phaser';
import TileSprite = Phaser.GameObjects.TileSprite;

export default class Example extends Phaser.Scene
{
    private w: number | undefined;
    private h: number | undefined;
    private sprite: Phaser.GameObjects.Sprite | undefined;

    private ground: TileSprite | undefined;
    private bg: TileSprite | undefined;
    constructor ()
    {
        super('Example');
    }

    preload ()
    {
        this.load.setBaseURL('http://localhost:3000');
        this.load.spritesheet('miner', miner_sprite, {frameWidth: 80, frameHeight:100});
        this.load.image('bg', sky);
        this.load.spritesheet('tiles', tiles, { frameWidth: 64, frameHeight: 64 });
    }

    create ()
    {
        this.bg = this.add.image(0, 0, 'bg').setOrigin(0);
        // this.bg.setDisplaySize(this.game.config.width, this.game.config.height);
        // @ts-ignore
        // this.bg.scaleX = this.game.config.width / this.bg.width;
        // this.bg.scaleY = this.game.config.height / this.bg.height;
        this.ground = this.add.tileSprite(0, 936, this.game.config.width, 64, 'tiles', 1).setOrigin(0);
        // this.w = this.cameras.main.width;
        // this.h = this.cameras.main.height;
        const minerAnimation = this.anims.create({
            key: 'mine',
            //@ts-ignore
            frames: this.anims.generateFrameNumbers('miner'),
            frameRate: 12
        });

        this.sprite = this.add.sprite(400, 536, 'miner');
        this.sprite.setOrigin(0.5, 1);

        // this.cameras.main.startFollow(this.sprite);
        // this.cameras.main.followOffset.set(0, 272);
    }

    update ()
    {
        this.input.on('pointerdown', () => {
            // @ts-ignore
            this.sprite.play({key: 'mine'});
            // @ts-ignore
            this.ground.tilePositionY += 0.01;
            // @ts-ignore
            this.bg?.setY(this.bg?.y - 0.01);
        });
    }
}