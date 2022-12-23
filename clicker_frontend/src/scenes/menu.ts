import Phaser from 'phaser';

export default class Menu extends Phaser.Scene {
    private CONFIG: any;
    private title!: Phaser.GameObjects.Text;
    private playText!: Phaser.GameObjects.Text;
    private bg!: Phaser.GameObjects.Graphics;

    constructor() {
        super({key: 'Menu', active: false});
    }

    init() {
        // @ts-ignore
        this.CONFIG = this.sys.game.CONFIG;
    }

    create() {
        // Background
        this.createBackground();
        // Game title
        this.title = this.add.text(
            this.CONFIG.centerX,
            150,
            'Clicker Royale',
            {font: '70px Roboto', color: '#000000'}
        );
        this.title.setOrigin(0.5)
        this.title.setColor('#000000')
        // Click to play text
        this.playText = this.add.text(
            this.CONFIG.centerX,
            this.CONFIG.centerY,
            'click to play',
            {font: '50px Roboto', color: '#000000'}
        );
        this.playText.setOrigin(0.5)
        this.playText.setColor('#000000')

        // Create mouse input
        this.createMouseInput();
        // Create keyboard input
        this.createKeyBoardInput();
    }

    createBackground() {
        this.bg = this.add.graphics({x: 0, y: 0});
        this.bg.fillStyle(0xF4CCA1, 1);
        this.bg.fillRect(0, 0, this.CONFIG.width, this.CONFIG.height);
    }

    createMouseInput() {
        this.input.on('pointerup', this.goPlay, this);
    }

    createKeyBoardInput() {
        const handleKeyUp = (e: { code: any; }) => {
            switch (e.code) {
                case 'Enter':
                    this.goPlay();
                    break;
            }
        }

        this.input.keyboard.on('keyup', handleKeyUp, this);
    }

    goPlay() {
        this.scene.start('Play');
    }
}