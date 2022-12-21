import Phaser from 'phaser';
export default class Boot extends Phaser.Scene {
    constructor() {
        super({key: 'Boot2', active: true});
    }

    init() {
    }

    preload () {
    }

    create() {
        this.scene.start('Preload');
    }
}