import Phaser from 'phaser';
export default class Menu extends Phaser.Scene {
    private CONFIG: any;
    private text: Phaser.GameObjects.Text | undefined;
    constructor() {
        super({key: 'Menu', active: false});
    }

    init() {
        // @ts-ignore
        this.CONFIG = this.sys.game.CONFIG;
    }

    preload () {

    }

    create() {
        this.text = this.add.text(this.CONFIG.centerX, this.CONFIG.centerY,'Menu');
        this.text.setOrigin(0.5)
        this.text.setColor('#000000')
    }
}