import Phaser from "phaser";

export default class ClickerRoyaleScene extends Phaser.Scene {
    depth!: number;
    loggedIn = false;

    constructor() {
        let config = {
            key: 'Play',
            active: false
        }
        super(config);
    }
}