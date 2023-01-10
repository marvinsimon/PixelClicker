import Generator from "../prefabs/Generator";
import ClickerRoyaleScene from "../ClickerRoyaleScene";
import ClickerRoyaleGame from "../ClickerRoyaleGame";

export default class Play extends ClickerRoyaleScene {
    CONFIG: any;
    PRIORITY!: { sky: number; background: number, floor: number; miner: number; objects: number; debris: number };
    private generator!: Generator;
    static gameInstance: ClickerRoyaleGame;

    init() {

        this.CONFIG = Play.gameInstance.CONFIG;
        this.PRIORITY = {
            sky: 2,
            background: 0,
            floor: 2,
            miner: 4,
            objects: 3,
            debris: 1,
        };

        this.generator = new Generator(this);
    }

    create() {
        this.loadingGame();
        this.loadLogOut();
        // Create floor
        this.generator.setup();
    }

    update() {
        this.generator.update();

        this.depth = Play.gameInstance.depth;
    }

    loadingGame() {
        this.game.events.off('loadGame');
        this.game.events.on('loadGame', () => {
            this.loggedIn = true;
            this.registry.destroy();
            this.scene.restart();
        });
    }

    loadLogOut() {
        this.game.events.off('logOut');
        this.game.events.on('logOut', () => {
            this.loggedIn = false;
            this.registry.destroy();
            this.scene.restart();
        });
    }

    static setGameInstance(game: ClickerRoyaleGame) {
        this.gameInstance = game;
    }
}