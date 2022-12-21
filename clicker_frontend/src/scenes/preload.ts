import Phaser from 'phaser';
export default class Preload extends Phaser.Scene {
    constructor() {
        super({key: 'Preload', active: false});
    }

    init() {
    }

    preload () {
    }

    create() {
        this.scene.start('Menu');
    }
}