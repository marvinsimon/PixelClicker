import type {Component} from "solid-js";
import {createSignal, onCleanup, onMount, Show} from "solid-js";
import styles from "./App.module.css";
import pvpModule from "./styles/PvP.module.css";
import mineModule from "./styles/Mining.module.css";
import displayModule from "./styles/Display.module.css";
import shopModule from "./styles/Shop.module.css";
import rankModule from "./styles/Leaderboard.module.css";
import {ClientMessages, ServerMessages} from "../shared_volume/game_messages";
import ClickerRoyaleGame from "./ClickerRoyaleGame";
import Phaser from "phaser";
import Preload from "./scenes/preload";
import Play from "./scenes/play";
import ClickerRoyale_Wappen from "./assets/img/ClickerRoyale_Wappen.png";
import board_with_icons from "./assets/img/board_with_icons.png";
import Brett_Neu_test from "./assets/img/Brett_Neu_test.png";
import board_new_small from "./assets/img/board_new_small.png";
import leaderboard4 from "./assets/img/leaderboard4.png";
import button_click from "./assets/audio/button_click.mp3";

/**
 * This is the Frontend of Clicker Royale.
 */
const App: Component = () => {
    /*
    * Variable and signal initialisations/declarations
    */
    let password_field: HTMLInputElement = {} as HTMLInputElement;
    let email_field: HTMLInputElement = {} as HTMLInputElement;
    let username_field: HTMLInputElement = {} as HTMLInputElement;
    let uploaded_image: any;

    const [ore, setOre] = createSignal(0);
    const [auth, setAuth] = createSignal(false);
    const [depth, setDepth] = createSignal(0);
    const [username, setUsername] = createSignal("");
    const [show, setShow] = createSignal(false); //PopUp Variable
    const [innerShow, setInnerShow] = createSignal(false);
    const [showProfile, setShowProfile] = createSignal(false);
    const [shovelDepth, setShovelDepth] = createSignal(1);
    const [shovelAmount, setShovelAmount] = createSignal(1);
    const [automation_on, setAutomation] = createSignal(false);
    const [autoDepth, setAutoDepth] = createSignal(1);
    const [autoAmount, setAutoAmount] = createSignal(1);
    const [attackLevel, setAttackLevel] = createSignal(1);
    const [defenceLevel, setDefenceLevel] = createSignal(1);
    const [loggedIn, setLoggedIn] = createSignal(false);
    const [showMining, setShowMining] = createSignal(false);
    const [showPVP, setShowPVP] = createSignal(false);
    const [showLoot, setShowLoot] = createSignal(false);
    const [loot, setLoot] = createSignal(0);
    const [attacked, setAttacked] = createSignal(false);
    const [showOfflineResources, setShowOfflineResources] = createSignal(false);
    const [totalDepth, setTotalDepth] = createSignal(0);
    const [totalAmount, setTotalAmount] = createSignal(0);
    const [attackPrice, setAttackPrice] = createSignal(50);
    const [defencePrice, setDefencePrice] = createSignal(50);
    const [shovelDepthPrice, setShovelDepthPrice] = createSignal(50);
    const [shovelAmountPrice, setShovelAmountPrice] = createSignal(50);
    const [autoDepthPrice, setAutoDepthPrice] = createSignal(50);
    const [autoAmountPrice, setAutoAmountPrice] = createSignal(50);
    const [costNumber, setCostNumber] = createSignal("");
    const [diamond, setDiamond] = createSignal(0);
    const [showLeaderboard, setShowLeaderboard] = createSignal(false);
    const [pvpScore, setPvpScore] = createSignal(0);
    const [showShop, setShowShop] = createSignal(false);

    let players: string;
    let game: ClickerRoyaleGame;
    let socket: WebSocket | undefined;

    /*
    * Sets up the Backend connection and handles incoming Event calls
    */
    const connectBackend = async () => {
        if (socket != null)
            disconnectBackend();
        socket = new WebSocket("wss://clicker-royal.xms-dev.com/game");

        // Handle incoming messages
        socket.onmessage = (msg) => {
            const event: ServerMessages = JSON.parse(msg.data as string);

            // Extract the message type from data string
            const re: RegExp = /(([A-Z]([a-z]*[a-z])?)*([A-Z]([a-z]*[a-z])))/
            let arr = (msg.data as string).match(re)![0];

            // Switch for event handling, the IDE might throw a lot of errors here because it doesn't recognize the right content for the cases.
            // The functionality of the Switch case is not affected by this.

            if (typeof event === 'object') {
                switch (arr) {
                    case "NewState":
                        if ('NewState' in event) {
                            setOre(event.NewState.ore);
                            setDepth(event.NewState.depth);
                            game.depth = depth();
                        }
                        break;
                    case "ShovelDepthUpgraded":
                        if ("ShovelDepthUpgraded" in event) {
                            setShovelDepth(event.ShovelDepthUpgraded.new_level);
                            if (event.ShovelDepthUpgraded.success) {
                                subtractCost(formatNumbers(shovelDepthPrice()));
                            }
                            setShovelDepthPrice(event.ShovelDepthUpgraded.new_upgrade_cost);
                        }
                        break;
                    case "ShovelAmountUpgraded":
                        if ("ShovelAmountUpgraded" in event) {
                            setShovelAmount(event.ShovelAmountUpgraded.new_level);
                            if (event.ShovelAmountUpgraded.success) {
                                subtractCost(formatNumbers(shovelAmountPrice()));
                            }
                            setShovelAmountPrice(event.ShovelAmountUpgraded.new_upgrade_cost);
                        }
                        break;
                    case "AutomationStarted":
                        if ("AutomationStarted" in event) {
                            setAutomation(event.AutomationStarted.success);
                            if (event.AutomationStarted.success) {
                                subtractCost("200");
                                startAutomation();
                            }
                        }
                        break;
                    case "AutomationDepthUpgraded":
                        if ("AutomationDepthUpgraded" in event) {
                            setAutoDepth(event.AutomationDepthUpgraded.new_level);
                            if (event.AutomationDepthUpgraded.success) {
                                subtractCost(formatNumbers(autoDepthPrice()));
                            }
                            setAutoDepthPrice(event.AutomationDepthUpgraded.new_upgrade_cost);
                        }
                        break;
                    case "AutomationAmountUpgraded":
                        if ("AutomationAmountUpgraded" in event) {
                            setAutoAmount(event.AutomationAmountUpgraded.new_level);
                            if (event.AutomationAmountUpgraded.success) {
                                subtractCost(formatNumbers(autoAmountPrice()));
                            }
                            setAutoAmountPrice(event.AutomationAmountUpgraded.new_upgrade_cost);
                        }
                        break;
                    case "AttackLevelUpgraded":
                        if ("AttackLevelUpgraded" in event) {
                            setAttackLevel(event.AttackLevelUpgraded.new_level);
                            if (event.AttackLevelUpgraded.success) {
                                subtractCost(formatNumbers(attackPrice()));
                            }
                            setAttackPrice(event.AttackLevelUpgraded.new_upgrade_cost);
                        }
                        break;
                    case "DefenceLevelUpgraded":
                        if ("DefenceLevelUpgraded" in event) {
                            setDefenceLevel(event.DefenceLevelUpgraded.new_level);
                            if (event.DefenceLevelUpgraded.success) {
                                subtractCost(formatNumbers(defencePrice()));
                            }
                            setDefencePrice(event.DefenceLevelUpgraded.new_upgrade_cost);
                        }
                        break;
                    case "CombatElapsed":
                        if ("CombatElapsed" in event) {
                            lootArrived(event.CombatElapsed);
                        }
                        break;
                    case "LoggedIn":
                        if ("LoggedIn" in event) {
                            setAuth(true);
                            setLoggedIn(true);
                        }
                        break;
                    case "LoginState":
                        if ("LoginState" in event) {
                            setLoginStates(event.LoginState);
                        }
                        break;
                    case "MinedOffline":
                        if ("MinedOffline" in event) {
                            setTotalDepth(event.MinedOffline.depth);
                            setTotalAmount(event.MinedOffline.ore);
                            setShowOfflineResources(true);
                        }
                        break;
                    case "SetUsername":
                        if ("SetUsername" in event) {
                            setUsername(event.SetUsername.username);
                        }
                        break;
                    case "SetProfilePicture":
                        if ("SetProfilePicture" in event) {
                            uploaded_image = event.SetProfilePicture.pfp;
                        }
                        break;
                    case "TreasureFound":
                        if ("TreasureFound" in event) {
                            setOre(event.TreasureFound.ore);
                        }
                        break;
                    case "DiamondFound":
                        if ("DiamondFound" in event) {
                            setDiamond(event.DiamondFound.diamond);
                        }
                        break;
                    case "GameData":
                        if ("GameData" in event) {
                            loadGameData(event.GameData.picked_first_diamond);
                        }
                        break;
                    case "SendLeaderboard":
                        if ("SendLeaderboard" in event) {
                            players = event.SendLeaderboard.players;
                        }
                        break;
                    case "SendPvpScore":
                        if ("SendPvpScore" in event) {
                            setPvpScore(event.SendPvpScore.pvp_score);
                        }
                        break;
                }
            }
        }

        socket.onopen = () => {
            const event: ClientMessages = "GetLoginData";
            window.setTimeout(() => {
                socket?.send(JSON.stringify(event));
            }, 1000);
        }
    }

    onMount(async () => {
        await connectBackend();
        setupPhaserGame();
    });

    /*
    * Sets up and configures the phaser contents of the game
    */
    function setupPhaserGame() {
        // Scenes
        let scenes = [];

        scenes.push(Preload);
        scenes.push(Play);

        // Game config
        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            //@ts-ignore
            parent: document.getElementById('main'),
            title: 'Clicker Royale',
            url: 'http://localhost:3000',
            width: 1000,
            height: 830,
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: {y: 2000}
                }
            },
            scene: scenes,
            pixelArt: true,
            backgroundColor: 0x000000
        };

        // Create game app
        game = new ClickerRoyaleGame(config)
        // Globals
        game.CONFIG = {
            width: config.width,
            height: config.height,
            // @ts-ignore
            centerX: Math.round(0.5 * config.width),
            // @ts-ignore
            centerY: Math.round(0.5 * config.height),
            tile: 64,
        }

        // Sound
        game.sound_on = true;

        // Game Data
        game.tileName = "";
        game.crackedTileName = "";
        game.backgroundTileName = "";
        game.pickedFirstDiamond = false;
        game.barRowCounter = 0;
        game.automation = false;

        Play.setGameInstance(game);
    }

    /*
    * Refreshes and updates game screen in a set interval
    */
    window.setInterval(function () {
        // Variable Declarations with Query Selection
        let upgrade_attack_icon = document.querySelector("." + pvpModule.icon_upgrade_attack);
        let upgrade_defence_icon = document.querySelector("." + pvpModule.icon_upgrade_defence);
        let upgrade_shovel_depth_icon = document.querySelector("." + mineModule.icon_upgrade_speed);
        let upgrade_shovel_amount_icon = document.querySelector("." + mineModule.icon_upgrade_amount);
        let upgrade_auto_depth_icon = document.querySelector("." + mineModule.icon_upgrade_automate_speed);
        let upgrade_auto_amount_icon = document.querySelector("." + mineModule.icon_upgrade_automate_amount);
        let automate = document.querySelector("." + mineModule.icon_automate);

        // Sets icon graphics depending on the current state
        if (upgrade_attack_icon != null) {
            if (ore() >= attackPrice()) {
                upgrade_attack_icon!.classList.remove(styles.hide);
            } else {
                upgrade_attack_icon!.classList.add(styles.hide);
            }
        }
        if (upgrade_defence_icon != null) {
            if (ore() >= defencePrice()) {
                upgrade_defence_icon!.classList.remove(styles.hide);
            } else {
                upgrade_defence_icon!.classList.add(styles.hide);
            }
        }
        if (upgrade_shovel_depth_icon != null) {
            if (ore() >= shovelDepthPrice()) {
                upgrade_shovel_depth_icon!.classList.remove(styles.hide);
            } else {
                upgrade_shovel_depth_icon!.classList.add(styles.hide);
            }
        }
        if (upgrade_shovel_amount_icon != null) {
            if (ore() >= shovelAmountPrice()) {
                upgrade_shovel_amount_icon!.classList.remove(styles.hide);
            } else {
                upgrade_shovel_amount_icon!.classList.add(styles.hide);
            }
        }
        if (upgrade_auto_depth_icon != null) {
            if (ore() >= autoDepthPrice()) {
                upgrade_auto_depth_icon!.classList.remove(styles.hide);
            } else {
                upgrade_auto_depth_icon!.classList.add(styles.hide);
            }
        }
        if (upgrade_auto_amount_icon != null) {
            if (ore() >= autoAmountPrice()) {
                upgrade_auto_amount_icon!.classList.remove(styles.hide);
            } else {
                upgrade_auto_amount_icon!.classList.add(styles.hide);
            }
        }
        if (automate != null) {
            if (ore() >= 200) {
                automate!.classList.remove(styles.hide);
            } else {
                automate!.classList.add(styles.hide);
            }
        }
    }, 30);

    /*
    * Formats numbers to be compacted once they reach a certain limit
    */
    function formatNumbers(formatNumber: number) {
        if (formatNumber < 1000) {
            return formatNumber.toString();
        } else {
            return Intl.NumberFormat('en-US', {
                minimumFractionDigits: 1, maximumFractionDigits: 1,
                //@ts-ignore
                notation: 'compact',
                compactDisplay: 'short'
            }).format(formatNumber);
        }
    }

    /*
    * Shows the popup for combat results
    */
    function lootArrived(CombatElapsed: { loot: number }) {
        window.setTimeout(() => {
            setShowLoot(true);
            setLoot(CombatElapsed.loot);
        }, 700)

    }

    /*
    * Sets state displays on login to the player's game state values
    */
    const setLoginStates = (LoginState: { shovel_amount: number; shovel_depth: number; automation_depth: number; automation_amount: number; attack_level: number; defence_level: number; automation_started: boolean; diamond: number }) => {
        setShovelDepth(LoginState.shovel_depth);
        setShovelAmount(LoginState.shovel_amount);
        setAutoAmount(LoginState.automation_amount);
        setAutoDepth(LoginState.automation_depth);
        setAutomation(LoginState.automation_started);
        setAttackLevel(LoginState.attack_level);
        setDefenceLevel(LoginState.defence_level);
        setDiamond(LoginState.diamond);
        if (loggedIn()) {
            void loadGame();
        }
        if (automation_on()) {
            game.automation = true;
        }
    }

    /*
    * Sets the game screen to the initial display
    */
    const resetScreen = () => {
        if (showMining() || showPVP() || showLeaderboard()) {
            slideOutAutomate();
            slideOut();
            window.setTimeout(function () {
                setShowMining(false);
                setShowPVP(false);
                setShowLeaderboard(false);
                unHide();
            }, 1300);
            rotateGearOut();
        }
    }

    /*
    * Disconnects the Backend and resets the game screen
    */
    const disconnectBackend = () => {
        resetScreen();
        socket?.close();
    }

    /*
    * Event Listeners
    */
    window.addEventListener('mineEvent', async () => {
        await mine();
    })

    window.addEventListener('treasureEvent', async () => {
        await treasure();
    });

    window.addEventListener('diamondEvent', async () => {
        await pickedUpDiamond();
    });

    /*
    * Game Events are created and send to the Backend here.
    */
    const mine = async () => {
        if (socket) {
            const event: ClientMessages = "Mine";
            await socket.send(JSON.stringify(event));
        }
    }

    const upgradeShovelAmount = async () => {
        if (socket) {
            const event: ClientMessages = "UpgradeShovelAmount";
            await socket.send(JSON.stringify(event));
        }
    }

    const upgradeShovelDepth = async () => {
        if (socket) {
            const event: ClientMessages = "UpgradeShovelDepth";
            await socket.send(JSON.stringify(event));
        }
    }

    // starts the automation
    const automate = async () => {
        if (socket) {
            const event: ClientMessages = "StartAutomation";
            await socket.send(JSON.stringify(event));
        }
    }

    const upgradeAutoDepth = async () => {
        if (socket) {
            const event: ClientMessages = "UpgradeAutomationDepth";
            await socket.send(JSON.stringify(event));
        }
    }

    const upgradeAutoAmount = async () => {
        if (socket) {
            const event: ClientMessages = "UpgradeAutomationAmount";
            await socket.send(JSON.stringify(event));
        }
    }

    const upgradeAttackLevel = async () => {
        if (socket) {
            const event: ClientMessages = "UpgradeAttackLevel";
            await socket.send(JSON.stringify(event));
        }
    }

    const upgradeDefenceLevel = async () => {
        if (socket) {
            const event: ClientMessages = "UpgradeDefenceLevel";
            await socket.send(JSON.stringify(event));
        }
    }

    const treasure = async () => {
        if (socket) {
            const event: ClientMessages = "Treasure";
            await socket.send(JSON.stringify(event));
        }
    }

    const pickedUpDiamond = async () => {
        if (socket) {
            const event: ClientMessages = 'Diamond';
            await socket.send(JSON.stringify(event));
        }
    }

    const loadGame = async () => {
        if (socket) {
            setTimeout(async () => {
                const event: ClientMessages = 'LoadGame';
                await socket?.send(JSON.stringify(event));
            }, 200);
        }
    }

    function loadGameData(picked_first_diamond: boolean) {
        game.pickedFirstDiamond = picked_first_diamond;
        game.events.emit('loadGame');
    }

    function startAutomation() {
        game.automation = true;
        game.events.emit('startAutomate');
    }

    const sign_up = async () => {
        let auth = btoa(`${email_field.value}:${password_field.value}`);
        let username = username_field.value;
        const response = await fetch("http://localhost:3001/sign_up", {
            method: "GET",
            credentials: "include",
            headers: {Authorization: `Basic ${auth}`, Username: username}
        });
        switch (response.status) {
            case 200:   //OK
                setLoggedIn(true);
                setAuth(true);
                setUsername(username);
                uploaded_image = "";
                break;
            case 400:   //Bad_Request
                badStatusPopup();
                break;
            case 406:   //Not_Acceptable
                //email did not follow form [abc]@[nop].[xyz] or username was inappropriate
                break;
        }
    }

    const login = async () => {
        if (!auth()) {
            disconnectBackend();
            let auth = btoa(`${email_field.value}:${password_field.value}`);
            const response = await fetch("http://localhost:3001/login", {
                method: "GET",
                credentials: "include",
                headers: {Authorization: `Basic ${auth}`},
            });
            switch (response.status) {
                case 200:
                    await connectBackend();
                    setLoggedIn(true);
                    setAuth(true);
                    break;
                case 401:
                    //credentials did not match any existing user
                    badStatusPopup();
                    break;
            }
        }
    }

    const sign_out = async () => {
        if (auth()) {
            const response = await fetch("http://localhost:3001/logout", {
                method: "GET",
                credentials: "include",
            });
            if (response.ok) {
                disconnectBackend();
                setLoggedIn(false);
                setAuth(false);
                game.events.emit('logOut');
                setUsername("")
                setPvpScore(0);
                game.automation = false;
                await connectBackend();
            }
        } else {
        }
    }

    const attack = async () => {
        const response = await fetch("http://localhost:3001/combat", {
            method: "GET",
            credentials: "include",
        });
        if (response.status == 200) { //200 == StatusCode OK
            setAttacked(true);
            //Start timer
            await startTimer();
        } else if (response.status == 204) { //204 == StatusCode NO_CONTENT
        }
    }

    /*
    * Handler for click events outside of assigned element
    */
    const clickOutside = async (el: { contains: (arg0: any) => any }, accessor: () => { (): any; new(): any }) => {
        const onClick = (e: MouseEvent) => !el.contains(e.target) && accessor()?.();
        document.body.addEventListener("click", onClick);
        onCleanup(() => document.body.removeEventListener("click", onClick));
    }

    /*
    * Functions to change visibility of elements on the game screen
    */
    const hide = () => {
        document.querySelectorAll("." + styles.buttonItem).forEach(value => value.classList.add(styles.hide));
    }

    const unHide = () => {
        document.querySelectorAll("." + styles.buttonItem).forEach(value => value.classList.remove(styles.hide));
    }

    /*
    * Functions to handle the slide out menu panels and animations
    */
    const slideOut = () => {
        let variable = document.querySelector("." + styles.slideIn);
        if (variable) {
            variable.classList.remove(styles.slideIn);
            variable.classList.add(styles.slideOut);
        }
    }

    const slideOutAutomate = () => {
        let variable = document.querySelector("." + styles.slideIn_automate);
        if (variable) {
            variable.classList.remove(styles.slideIn_automate);
            variable.classList.add(styles.slideOut_automate);
        }
    }

    const rotateGearIn = () => {
        let left = document.querySelector("." + styles.gear_left);
        left!.classList.remove(styles.gear_rotate_counterClockwise);
        left!.classList.add(styles.gear_rotate_clockwise);

        let right = document.querySelector("." + styles.gear_right);
        right!.classList.remove(styles.gear_rotate_clockwise);
        right!.classList.add(styles.gear_rotate_counterClockwise);
    }

    const rotateGearOut = () => {
        let left = document.querySelector("." + styles.gear_left);
        left!.classList.remove(styles.gear_rotate_clockwise);
        left!.classList.add(styles.gear_rotate_counterClockwise);

        let right = document.querySelector("." + styles.gear_right);
        right!.classList.remove(styles.gear_rotate_counterClockwise);
        right!.classList.add(styles.gear_rotate_clockwise);
    }

    /*
    * Starts the combat timer on the pvp tab
    */
    const startTimer = async () => {
        let seconds: string | number = 100;
        let minutes: string | number = 6;
        let timeLeft = minutes * seconds;
        let combatTime = setInterval(function () {
            minutes = parseInt(String(timeLeft / 60), 10);
            seconds = parseInt(String(timeLeft % 60), 10);

            minutes = minutes < 10 ? "0" + minutes : minutes;
            seconds = seconds < 10 ? "0" + seconds : seconds;

            // @ts-ignore
            document.getElementById("timer").innerHTML = minutes + ":" + seconds;

            if (--timeLeft < 0) {
                clearInterval(combatTime);
                setAttacked(false);
            }
        }, 1000);
    }

    /*
    * Functions for sounds on button click
    */
    const buttonClick = new Audio(button_click);
    buttonClick.preload = "none";

    const playButtonSound = async () => {
        await buttonClick.play();
    }

    /*
    * Updates cost values for upgrades
    */
    function subtractCost(cost: string) {
        setCostNumber("-" + cost);
        let c = document.getElementById("cost");
        if (c != null) {
            c.classList.remove(styles.costFadeOut);
            void c.offsetWidth;
            c.classList.add(styles.costFadeOut);
        }
    }

    /*
    * Popup for bad status cases
    */
    function badStatusPopup() {
        let inUse = document.getElementById("inUse");
        let invalid = document.getElementById("invalid");

        if (inUse != null) {
            inUse.classList.remove(styles.fadeout);
            void inUse.offsetWidth;
            inUse.classList.add(styles.fadeout);
        }
        if (invalid != null) {
            invalid.classList.remove(styles.fadeout);
            void invalid.offsetWidth;
            invalid.classList.add(styles.fadeout);
        }
    }

    /*
    * Account dropdown menu
    */
    const dropdown = async () => {
        document.querySelector("#myDropdown")!.classList.toggle(styles.show)
    }

    /*
    * Functions to load, save and show a profile picture on the account page
    */
    function loadPfp(this: any) {
        const image_input = document.querySelector("#image_input");
        image_input!.addEventListener("change", () => {
            const reader = new FileReader();
            reader.addEventListener("load", () => {
                uploaded_image = reader.result;
                document.querySelector<HTMLDivElement>("#display_image")!.style.backgroundImage = `url(${uploaded_image})`;
            });
            reader.readAsDataURL(this.files[0]);
        });
    }

    function displayPfp() {
        let img = uploaded_image as string;
        document.querySelector<HTMLDivElement>("#display_image")!.style.backgroundImage = `url(${img})`;
    }

    const saveImg = async () => {
        await fetch("http://localhost:3001/save_pfp", {
            method: "GET",
            credentials: "include",
            headers: {pfp: uploaded_image},
        });
    }

    /*
    * Functions to show the leaderboard field
    */
    function showScores() {
        let allPlayers = JSON.parse(players);
        let leaderboard = document.querySelector("#leaderboard");
        leaderboard!.innerHTML = "";
        let counter = 1;
        allPlayers.forEach((player: any) => {
            let name = document.createElement("label");
            name.innerHTML = counter + ". " + player.username;

            let score = document.createElement("label");
            score.innerHTML = player.pvp_score;
            score.style.color = "#b7b7b7";
            score.style.marginLeft = "20px";
            score.style.direction = "rtl";
            leaderboard!.appendChild(name);
            leaderboard!.appendChild(score);
            counter++;
        })

        let yourScore = document.querySelector("#pvpScore");
        let scoreLabel = document.createElement('label');
        scoreLabel.innerHTML = "Your Score: " + pvpScore().toString();
        yourScore!.appendChild(scoreLabel);
    }

    /*
    * Returns the HTML page of Clicker Royale
    */
    return (
        <div class={styles.App}>
            <div class={styles.container}>
                <div class={styles.vBar}></div>
                <div class={styles.heil}>
                    <div class={styles.heil_img}></div>
                </div>
                <div class={styles.header}>
                    <img src={ClickerRoyale_Wappen} class={styles.header_logo} alt={"ClickerRoyale Logo"}/>
                    <label>{username()}</label>
                    <Show when={!loggedIn()}
                          fallback={
                              <div>
                                  <button class={styles.User_symbol} onClick={() => {
                                      void dropdown();
                                  }}></button>
                                  <div id="myDropdown" class={styles.dropdownContent}>
                                      <a onClick={() => {
                                          setShowProfile(true);
                                          void playButtonSound();
                                          void displayPfp()
                                      }}>Profile</a>
                                      <a>Background</a>
                                      <a onClick={() => {
                                          void sign_out();
                                          setShow(false);
                                          setInnerShow(false);
                                          void playButtonSound()
                                      }}>Log out</a>
                                  </div>
                                  <Show when={showProfile()}
                                        fallback={""} keyed>
                                      <div class={styles.modal} use:clickOutside={() => setShowProfile(false)}>
                                          <h3>Profile</h3>
                                          <div class={styles.flexItem}>
                                              <input type="file" class={styles.image_input} id="image_input"
                                                     accept="image/png, image/jpg" onclick={loadPfp}/>
                                              <div id="display_image" class={styles.displayimage}>
                                              </div>
                                              <button onClick={saveImg}>Safe</button>
                                          </div>
                                          <div class={styles.flexItem2}>
                                              <label>Name: Test</label>
                                              <br/>
                                              <label>Email: {email_field!.value}</label>
                                          </div>

                                      </div>
                                  </Show>
                              </div>
                          } keyed>

                        <button onClick={() => {
                            setShow(true);
                            void playButtonSound()
                        }} class={styles.button_sign_up}>Login
                        </button>
                        <Show when={show()}
                              fallback={""} keyed>
                            <div class={styles.modal} use:clickOutside={() => setShow(false)}>
                                <div class={styles.popup_h}>
                                    <h3>Login</h3>
                                </div>
                                <input type="text" ref={email_field!} style="width: 300px;"
                                       placeholder="email or username.."/>
                                <input type="password" ref={password_field!} style="width: 300px;"
                                       placeholder="password.."/>
                                <input type="submit" value="Log In" onClick={login}/>
                                <div id={"invalid"} class={styles.invalid}>
                                    <label>Invalid Credentials</label>
                                </div>
                                <div class={styles.switch}>
                                    <p>Not registered?</p>
                                </div>
                                <div class={styles.switch}>
                                    <button class={styles.buttonSwitch} onClick={() => {
                                        setShow(false);
                                        setInnerShow(true)
                                    }}>Sign Up
                                    </button>
                                </div>
                            </div>
                        </Show>

                        <Show when={innerShow()}
                              fallback={""} keyed>
                            <div class={styles.modal} use:clickOutside={() => setInnerShow(false)}>
                                <div class={styles.popup_h}>
                                    <h3>Sign Up</h3>
                                </div>
                                <input type="text" ref={email_field!} style="width: 300px;"
                                       placeholder="email.."/>
                                <input type="text" ref={username_field!} style="width: 300px;"
                                       placeholder="username.."/>
                                <input type="password" ref={password_field!} style="width: 300px;"
                                       placeholder="password.."/>
                                <input type="submit" value="Sign Up" onClick={sign_up}/>
                                <div id={"inUse"} class={styles.invalid}>
                                    <label>Email already in use</label>
                                </div>
                                <div class={styles.switch}>
                                    <p>Already signed up?</p>
                                </div>
                                <div class={styles.switch}>
                                    <button class={styles.buttonSwitch} onClick={() => {
                                        setShow(true);
                                        setInnerShow(false)
                                    }}>Login
                                    </button>
                                </div>
                            </div>
                        </Show>
                    </Show>
                </div>
                <div class={styles.woodBar}>
                </div>
                <div class={styles.board}>
                    <div class={styles.val_board}>
                        <div class={styles.board_img_container}>
                            <img src={board_with_icons} class={styles.board_img} alt={"Value board"}/>
                            <div id={"cost"} class={styles.cost}>{costNumber()}</div>
                            <div class={styles.label_header + " " + displayModule.label_ore}>
                                <label>{formatNumbers(ore())}</label>
                            </div>
                            <div class={styles.label_header + " " + displayModule.label_depth}>
                                <label>{formatNumbers(depth())}</label>
                            </div>
                            <div class={styles.label_header + " " + displayModule.label_diamond}>
                                <label>{diamond}</label>
                            </div>
                        </div>
                    </div>
                </div>
                <div id={'main'} class={styles.main}>
                </div>
                <div class={styles.controls}>
                    <a class={styles.gear_normal + " " + styles.gear_left}/>
                    <a class={styles.gear_normal + " " + styles.gear_right}></a>
                    <Show when={showPVP()}
                          fallback={
                              <>
                                  <div class={styles.buttonItem}>
                                      <button onClick={() => {
                                          void playButtonSound();
                                          setShowPVP(true);
                                          hide();
                                          rotateGearIn();
                                      }} class={styles.button}>PVP
                                      </button>
                                  </div>
                              </>
                          } keyed>
                        <div class={styles.slideIn}>
                            <div class={styles.image_container}>
                                <img src={Brett_Neu_test} class={styles.board_img_right} alt={"Control board"}/>
                                <button class={styles.button_close} onClick={() => {
                                    slideOut();
                                    window.setTimeout(function () {
                                        setShowPVP(false);
                                        unHide();
                                    }, 1300);
                                    rotateGearOut();
                                }}>
                                    <label class={styles.label_header + " " + styles.label_close}>X</label>
                                </button>
                                <a class={styles.label_board}>
                                    <label class={styles.label_header + " " + pvpModule.label_pvp}>PVP</label>
                                </a>
                                <button data-attLvl={'Lv' + attackLevel()}
                                        class={styles.button + " " + pvpModule.upgrade_attack}
                                        onClick={() => {
                                            void upgradeAttackLevel();
                                        }}><span>ATK</span>
                                    <a class={styles.icon_upgrade + " " + pvpModule.icon_upgrade_attack}></a>
                                </button>
                                <label
                                    class={styles.label_header + " " + pvpModule.label_attack_level}>{formatNumbers(attackPrice())}</label>
                                <a class={styles.ore + " " + pvpModule.attack_ore}></a>
                                <button data-defLvl={'Lv' + defenceLevel()}
                                        class={styles.button + " " + pvpModule.upgrade_defence}
                                        onClick={() => {
                                            void upgradeDefenceLevel();
                                        }}><span>DEF</span>
                                    <a class={styles.icon_upgrade + " " + pvpModule.icon_upgrade_defence}></a>
                                </button>
                                <label
                                    class={styles.label_header + " " + pvpModule.label_defence_level}>{formatNumbers(defencePrice())}</label>
                                <a class={styles.ore + " " + pvpModule.defence_ore}></a>
                                <Show when={attacked()}
                                      fallback={<button class={styles.button + " " + pvpModule.pvp_attack}
                                                        onClick={attack}></button>} keyed>
                                    <div class={pvpModule.pvp_clock}>
                                        <div class={pvpModule.firstHand}></div>
                                        <div class={pvpModule.secondHand}></div>
                                    </div>
                                    <span id={"timer"} class={styles.label_header + " " + styles.time}>10:00</span>
                                </Show>
                            </div>
                        </div>
                    </Show>

                    <Show when={showMining()}
                          fallback={
                              <>
                                  <div class={styles.buttonItem}>
                                      <button onClick={() => {
                                          void playButtonSound();
                                          setShowMining(true);
                                          hide();
                                          rotateGearIn();
                                      }} class={styles.button}>Mining
                                      </button>
                                  </div>
                              </>
                          } keyed>
                        <div class={styles.slideIn}>
                            <img src={Brett_Neu_test} class={styles.board_img_right} alt={"Control board"}/>
                            <button class={styles.button_close} onClick={() => {
                                if (automation_on()) {
                                    slideOutAutomate();
                                }
                                slideOut();
                                window.setTimeout(function () {
                                    setShowMining(false);
                                    unHide();
                                }, 1300);
                                rotateGearOut();
                            }}>
                                <label class={styles.label_header + " " + styles.label_close}>X</label>
                            </button>
                            <a class={styles.label_board}>
                                <label class={styles.label_header + " " + mineModule.label_mine}>Mining</label>
                            </a>
                            <button data-shovelSpeedLvl={'Lv' + shovelDepth()}
                                    class={styles.button + " " + mineModule.upgrade_speed}
                                    onClick={() => {
                                        void upgradeShovelDepth();
                                    }}><span>Depth</span>
                                <a class={styles.icon_upgrade + " " + mineModule.icon_upgrade_speed}></a>
                            </button>
                            <label
                                class={styles.label_header + " " + mineModule.label_speed_level}>{formatNumbers(shovelDepthPrice())}</label>
                            <a class={styles.ore + " " + mineModule.shovelDepth_ore}></a>
                            <button data-shovelAmountLvl={'Lv' + shovelAmount()}
                                    class={styles.button + " " + mineModule.upgrade_amount}
                                    onClick={() => {
                                        void upgradeShovelAmount();
                                    }}><span>Amount</span>
                                <a class={styles.icon_upgrade + " " + mineModule.icon_upgrade_amount}></a>
                            </button>
                            <label
                                class={styles.label_header + " " + mineModule.label_amount_level}>{formatNumbers(shovelAmountPrice())}</label>
                            <a class={styles.ore + " " + mineModule.shovelAmount_ore}></a>
                            <Show when={automation_on()}
                                  fallback={<>
                                      <button class={styles.button + " " + mineModule.automate}
                                              onClick={() => {
                                                  void automate();
                                              }}>Automate
                                          <a class={styles.icon_upgrade + " " + mineModule.icon_automate}></a>
                                      </button>
                                      <label
                                          class={styles.label_header + " " + mineModule.label_automate_cost}>200</label>
                                      <a class={styles.ore + " " + mineModule.automate_ore}></a>
                                  </>} keyed>
                                <label class={styles.label_header + " " + mineModule.label_automate}>Automate On</label>
                                <div class={styles.slideIn_automate}>
                                    <div class={styles.image_container_automate}>
                                        <img src={board_new_small} class={styles.board_img_automate}
                                             alt={"Automate Board"}/>
                                        <a class={mineModule.auto_label_board}>
                                            <label
                                                class={styles.label_header + " " + mineModule.label_auto}>Automate</label>
                                        </a>
                                        <button data-autoDepthLvl={'Lv' + autoDepth()}
                                                class={styles.button + " " + mineModule.upgrade_automate_speed}
                                                onClick={() => {
                                                    void upgradeAutoDepth();
                                                }}><span>Depth</span>
                                            <a class={styles.icon_upgrade + " " + mineModule.icon_upgrade_automate_speed}></a>
                                        </button>
                                        <label
                                            class={styles.label_header + " " + mineModule.label_speed_automate_level}>{formatNumbers(autoDepthPrice())}</label>
                                        <a class={styles.ore + " " + mineModule.autoDepth_ore}></a>
                                        <button data-autoAmountLvl={'Lv' + autoAmount()}
                                                class={styles.button + " " + mineModule.upgrade_automate_amount}
                                                onClick={() => {
                                                    void upgradeAutoAmount();
                                                }}><span>Amount</span>
                                            <a class={styles.icon_upgrade + " " + mineModule.icon_upgrade_automate_amount}></a>
                                        </button>
                                        <label
                                            class={styles.label_header + " " + mineModule.label_amount_automate_level}>{formatNumbers(autoAmountPrice())}</label>
                                        <a class={styles.ore + " " + mineModule.autoAmount_ore}></a>
                                    </div>
                                </div>
                            </Show>
                        </div>
                    </Show>

                    <Show when={showLeaderboard()}
                          fallback={
                              <>
                                  <div class={styles.buttonItem}>
                                      <button onClick={() => {
                                          void playButtonSound();
                                          setShowLeaderboard(true);
                                          hide();
                                          rotateGearIn();
                                          showScores();
                                      }} class={styles.button}>Rank
                                      </button>
                                  </div>
                              </>
                          } keyed>
                        <div class={styles.slideIn}>
                            <div class={styles.image_container}>
                                <img src={ leaderboard4} class={styles.board_img_right} alt={"Control board"}/>
                                <div id={"leaderboard"}
                                     class={styles.label_header + " " + rankModule.leaderboard}></div>
                                <div id={"pvpScore"} class={styles.label_header + " " + rankModule.score}>
                                </div>
                                <button class={styles.button_close + " " + rankModule.rank_button_close}
                                        onClick={() => {
                                            slideOut();
                                            window.setTimeout(function () {
                                                setShowLeaderboard(false);
                                                unHide();
                                            }, 1300);
                                            rotateGearOut();
                                        }}>
                                    <label class={styles.label_header + " " + styles.label_close}>X</label>
                                </button>
                                <a class={rankModule.rank_label_board}>
                                    <label class={styles.label_header + " " + rankModule.label_rank}>Leaderboard</label>
                                </a>
                            </div>
                        </div>
                    </Show>

                    <div class={styles.buttonItem}>
                        <button onClick={() => {
                            setShowShop(true);
                            void playButtonSound()
                        }} class={styles.button}>Shop
                        </button>
                    </div>

                    <Show when={showShop()}
                          fallback={""} keyed>
                        <div class={styles.modal + " " + shopModule.shop} use:clickOutside={() => setShowShop(false)}>
                            <div class={shopModule.shop_h}>
                                <h3>Shop</h3>
                            </div>
                            <div class={shopModule.spacer}>
                                <p>Backgrounds</p>
                            </div>
                            <div class={shopModule.items_container}>
                                <div class={shopModule.item}>
                                    <div class={shopModule.tags + " " + shopModule.tag_cherry}>
                                        <p class={shopModule.tag_p}>Cherry</p>
                                    </div>
                                    <div class={styles.buttonItem}>
                                        <button class={shopModule.button_buy}>1500</button>
                                    </div>
                                </div>
                                <div class={shopModule.item}>
                                    <div class={shopModule.tags + " " + shopModule.tag_mixed}>
                                        <p class={shopModule.tag_p}>Mixed</p>
                                    </div>
                                    <div class={styles.buttonItem}>
                                        <button class={shopModule.button_buy}>699</button>
                                    </div>
                                </div>
                                <div class={shopModule.item}>
                                    <div class={shopModule.tags + " " + shopModule.tag_spruce}>
                                        <p class={shopModule.tag_p}>Spruce</p>
                                    </div>
                                    <div class={styles.buttonItem}>
                                        <button class={shopModule.button_buy}>1500</button>
                                    </div>
                                </div>
                                <div class={shopModule.item}>
                                    <div class={shopModule.tags + " " + shopModule.tag_universe_dark}>
                                        <p class={shopModule.tag_p}>Dark Star</p>
                                    </div>
                                    <div class={styles.buttonItem}>
                                        <button class={shopModule.button_buy}>2690</button>
                                    </div>
                                </div>
                                <div class={shopModule.item}>
                                    <div class={shopModule.tags + " " + shopModule.tag_universe_light}>
                                        <p class={shopModule.tag_p}>Light Star</p>
                                    </div>
                                    <div class={styles.buttonItem}>
                                        <button class={shopModule.button_buy}>2690</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Show>

                    <Show when={showLoot()} keyed>
                        <div class={styles.modal} use:clickOutside={() => setShowLoot(false)}>
                            <label style="font-size:30px"> Success! </label>
                            <label style="font-size:20px"> Your Loot:</label>
                            <div class={styles.grid_ore}>
                                <div class={styles.offline_resource_icons + " " + styles.grid_ore_icon}></div>
                                <label class={styles.grid_ore_label}
                                       style="font-size:20px">{formatNumbers(loot())}</label>
                            </div>
                        </div>
                    </Show>

                    <Show when={showOfflineResources()} keyed>
                        <div class={styles.modal} use:clickOutside={() => setShowOfflineResources(false)}>
                            <label style="font-size:30px"> Welcome back!</label>
                            <label style="font-size:20px">Your Offline Loot:</label>
                            <div class={styles.grid_ore}>
                                <div class={styles.offline_resource_icons + " " + styles.grid_ore_icon}></div>
                                <label class={styles.grid_ore_label}
                                       style="font-size:20px">{formatNumbers(totalAmount())}</label>
                            </div>
                            <div class={styles.grid_depth}>
                                <div class={styles.offline_resource_icons + " " + styles.grid_depth_icon}></div>
                                <label class={styles.grid_depth_label}
                                       style="font-size:20px">{formatNumbers(totalDepth())}</label>
                            </div>
                        </div>
                    </Show>
                </div>
            </div>
        </div>
    );
};

export default App;
