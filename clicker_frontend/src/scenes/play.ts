import Generator from "../prefabs/Generator";
import ClickerRoyaleScene from "../ClickerRoyaleScene";
import ClickerRoyaleGame from "../ClickerRoyaleGame";

export default class Play extends ClickerRoyaleScene {
    CONFIG: any;
    PRIORITY!: { sky: number; background: number, floor: number; miner: number; objects: number; debris: number };
    private allow_input!: boolean;
    private is_pause!: boolean;
    private is_gameOver!: boolean;
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
        this.game.events.on('loadGame', () => {
            console.log("LoadLogIn")
            this.loggedIn = true;
            this.registry.destroy();
            this.game.events.off('loadGame');
            this.scene.restart();
            console.log('Restarting Logged In');
        });
    }

    loadLogOut() {
        this.game.events.on('logOut', () => {
            console.log("LoadLogOut")
            this.loggedIn = false;
            this.registry.destroy();
            this.game.events.off('logOut');
            this.scene.restart();
            console.log('Restarting Logged Out');
        });
    }

    static setGameInstance(game: ClickerRoyaleGame) {
        this.gameInstance = game;
    }
}