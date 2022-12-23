import Phaser from 'phaser';

export default class Boot extends Phaser.Scene {
    private CONFIG: any;
    constructor() {
        super({key: 'Boot', active: true});
    }

    init() {
        // @ts-ignore
        this.CONFIG = this.sys.game.CONFIG;
    }

    preload () {
    }

    create() {
        this.scene.start('Preload');
    }
}