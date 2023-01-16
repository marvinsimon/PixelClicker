import type {Component} from "solid-js";
import {createSignal, onCleanup, Show} from "solid-js";
import styles from "./App.module.css";
import pvpModule from "./styles/PvP.module.css";
import mineModule from "./styles/Mining.module.css";
import displayModule from "./styles/Display.module.css";
import shopModule from "./styles/Shop.module.css";
import {ClientMessages, ServerMessages} from "./game_messages";
import clicker_logo from "./assets/ClickerRoyale_Wappen.png";
import board from "./assets/Brettmiticon.png";
import board_right from "./assets/Brett2.png";
import small_board from "./assets/small_brett.png";
import game from "./assets/Playground.png";
import buttonSound from "./assets/button_click.mp3";
import digSound from "./assets/pick2.mp3";
import minerFeminine from "./assets/miner_feminine_1.png";

const App: Component = () => {

    let password_field: HTMLInputElement;
    let email_field: HTMLInputElement;
    let username_field: HTMLInputElement;

    const [ore, setOre] = createSignal(0);
    const [auth, setAuth] = createSignal(false);
    const [depth, setDepth] = createSignal(0);
    const [username, setUsername] = createSignal("")
    //PopUp Variable
    const [show, setShow] = createSignal(false);
    const [innershow, setInnerShow] = createSignal(false);
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
    const [showShop, setShowShop] = createSignal(false);

    let socket: WebSocket | undefined;

    const connectBackend = async () => {
        if (socket != null)
            disconnectBackend();
        socket = new WebSocket("ws://localhost:3001/game");
        socket.onmessage = (msg) => {
            const event: ServerMessages = JSON.parse(msg.data as string);
            const re: RegExp = /(([A-Z]([a-z]*[a-z])?)*([A-Z]([a-z]*[a-z])))/
            let arr = (msg.data as string).match(re)![0];
            switch (arr) {
                case "NewState":
                    console.log(event.NewState);
                    setOre(event.NewState.ore);
                    setDepth(event.NewState.depth);
                    break;
                case "ShovelDepthUpgraded":
                    console.log(event.ShovelDepthUpgraded);
                    setShovelDepth(event.ShovelDepthUpgraded.new_level);
                    break;
                case "ShovelAmountUpgraded":
                    console.log(event.ShovelAmountUpgraded);
                    setShovelAmount(event.ShovelAmountUpgraded.new_level);
                    break;
                case "AutomationStarted":
                    setAutomation(event.AutomationStarted.success);
                    break;
                case "AutomationDepthUpgraded":
                    console.log(event.AutomationDepthUpgraded);
                    setAutoDepth(event.AutomationDepthUpgraded.new_level);
                    break;
                case "AutomationAmountUpgraded":
                    console.log(event.AutomationAmountUpgraded);
                    setAutoAmount(event.AutomationAmountUpgraded.new_level);
                    break;
                case "AttackLevelUpgraded":
                    console.log(event.AttackLevelUpgraded);
                    setAttackLevel(event.AttackLevelUpgraded.new_level);
                    break;
                case "DefenceLevelUpgraded":
                    console.log(event.DefenceLevelUpgraded);
                    setDefenceLevel(event.DefenceLevelUpgraded.new_level);
                    break;
                case "CombatElapsed":
                    console.log(event.CombatElapsed);
                    lootArrived(event.CombatElapsed);
                    break;
                case "LoginState":
                    console.log(event.LoginState);
                    setLoginStates(event.LoginState);
                    break;
                case "LoggedIn":
                    console.log("Still logged in")
                    setAuth(true);
                    setLoggedIn(true);
                    break;
                case "MinedOffline":
                    console.log("Got offline resources")
                    setTotalDepth(event.MinedOffline.depth);
                    setTotalAmount(event.MinedOffline.ore);
                    setShowOfflineResources(true);
                    break;
                case "SetUsername":
                    setUsername(event.SetUsername.username);
                    break;
            }
        }
        socket.onopen = () => {
            const event: ClientMessages = "GetLoginData";
            window.setTimeout(() => {
                socket?.send(JSON.stringify(event));
            }, 1000);
        }
    }

    window.onload = async () => {
        await connectBackend();
    }

    window.setInterval(function () {
        let upgrade_attack_icon = document.querySelector("." + pvpModule.icon_upgrade_attack);
        let upgrade_defence_icon = document.querySelector("." + pvpModule.icon_upgrade_defence);
        let upgrade_shovel_depth_icon = document.querySelector("." + mineModule.icon_upgrade_speed);
        let upgrade_shovel_amount_icon = document.querySelector("." + mineModule.icon_upgrade_amount);
        let upgrade_auto_depth_icon = document.querySelector("." + mineModule.icon_upgrade_automate_speed);
        let upgrade_auto_amount_icon = document.querySelector("." + mineModule.icon_upgrade_automate_amount);
        let automate = document.querySelector("." + mineModule.icon_automate);
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
    }, 30)

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

    function lootArrived(CombatElapsed: { loot: number }) {
        window.setTimeout(() => {
            setShowLoot(true);
            setLoot(CombatElapsed.loot);
        }, 700)

    }

    const setLoginStates = (LoginState: { shovel_amount: number; shovel_depth: number; automation_depth: number; automation_amount: number; attack_level: number; defence_level: number; automation_started: boolean }) => {
        setShovelDepth(LoginState.shovel_depth);
        setShovelAmount(LoginState.shovel_amount);
        setAutoAmount(LoginState.automation_amount);
        setAutoDepth(LoginState.automation_depth);
        setAutomation(LoginState.automation_started);
        setAttackLevel(LoginState.attack_level);
        setDefenceLevel(LoginState.defence_level);
    }

    const resetScreen = () => {
        if (showMining() || showPVP()) {
            slideOutAutomate();
            slideOut();
            window.setTimeout(function () {
                setShowMining(false);
                setShowPVP(false);
                unHide();
            }, 1300);
            rotateGearOut();
        }
    }

    const disconnectBackend = () => {
        resetScreen();
        socket?.close();
    }

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

    const sign_up = async () => {
        let auth = btoa(`${email_field.value}:${password_field.value}`);
        let username = username_field.value;
        console.log(username);
        const response = await fetch("http://localhost:3001/sign_up", {
            method: "GET",
            credentials: "include",
            headers: {Authorization: `Basic ${auth}`, Username: username}
        });
        console.log(`sign_up: ${response.statusText}`);
        switch (response.status) {
            case 200:   //OK
                setLoggedIn(true);
                setAuth(true);
                setUsername(username);
                break;
            case 400:   //Bad_Request
                setBad_request_bool(true);
                console.log('Bad Request');
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
            console.log(`login: ${response.statusText}`);
            switch (response.status) {
                case 200:
                    await connectBackend();
                    setLoggedIn(true);
                    setAuth(true);
                    break;
                case 401:
                    //credentials did not match any existing user
                    setUnauthorized(true);
                    console.log('Unauthorized');
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
            console.log(`sign_out: ${response.statusText}`);
            if (response.ok) {
                disconnectBackend();
                setLoggedIn(false);
                setAuth(false);
                setUsername("")
                await connectBackend();
            }
        } else {
            console.log(`sign_out: failed`);
        }
    }

    const clickOutside = async (el: { contains: (arg0: any) => any }, accessor: () => { (): any; new(): any }) => {
        const onClick = (e: MouseEvent) => !el.contains(e.target) && accessor()?.();
        document.body.addEventListener("click", onClick);
        onCleanup(() => document.body.removeEventListener("click", onClick));
    }

    const hide = () => {
        document.querySelectorAll("." + styles.buttonitem).forEach(value => value.classList.add(styles.hide));
    }

    const unhide = () => {
        document.querySelectorAll("." + styles.buttonitem).forEach(value => value.classList.remove(styles.hide));
    }

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
    const startTimer = async () => {
        let seconds: string | number = 9;
        let minutes: string | number = 1;
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

    const attack = async () => {
        const response = await fetch("http://localhost:3001/combat", {
            method: "GET",
            credentials: "include",
        });
        if (response.status == 200) { //200 == StatusCode OK
            setAttacked(true);
            console.log("Start timer");
            //Start timer
            await startTimer();
        } else if (response.status == 204) { //204 == StatusCode NO_CONTENT
            console.log("No match");
        }
    }
    const buttonClick = new Audio(buttonSound);
    buttonClick.preload = "none";

    const playButtonSound = async () => {
        await buttonClick.play();
    }

    const dig = new Audio(digSound);
    dig.preload = "none";

    const playDigSound = async () => {
        await dig.play();
    }

    function subtractCost(cost: string) {
        setCostNumber("-" + cost);
        let c = document.getElementById("cost");
        if (c != null) {
            c.classList.remove(styles.costFadeOut);
            void c.offsetWidth;
            c.classList.add(styles.costFadeOut);
        }
    }

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

    const dropdown = async () => {
        document.querySelector("#myDropdown")!.classList.toggle(styles.show)
    }

    return (
        <div class={styles.App}>
            <div class={styles.container}>
                <div class={styles.vBar}></div>
                <div class={styles.heil}>
                    <div class={styles.heil_img}></div>
                </div>
                <div class={styles.header}>
                    <img src={clicker_logo} class={styles.header_logo} alt={"ClickerRoyale Logo"}/>
                    <label>{username()}</label>
                    <Show when={!loggedIn()}
                          fallback={
                        <div>
                            <button class={styles.User_symbol} onClick={() => {
                                dropdown();
                            }}></button>
                            <div id="myDropdown" class={styles.dropdowncntnt}>
                                <a>Profile</a>
                                <a>Background</a>
                                <a onClick={() => {sign_out();setShow(false);setInnerShow(false);}}>Log out</a>
                            </div>
                        </div>


                    }>

                        <button onClick={(e) => {setShow(true);void playButtonSound()}} class={styles.button_sign_up}>Login</button>
                        <Show when={show()}
                              fallback={""}>
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
                                    <button class={styles.buttonswitch} onClick={() => {
                                        setShow(false);
                                        setInnerShow(true)
                                    }}>Sign Up
                                    </button>
                                </div>
                            </div>
                        </Show>

                        <Show when={innershow()}
                              fallback={""}>
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
                                    <button class={styles.buttonswitch} onClick={() => {
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
                            <img src={board} class={styles.board_img} alt={"Value board"}/>
                            <div id={"cost"} class={styles.cost}>{costNumber()}</div>
                            <div class={styles.label_header + " " + displayModule.label_ore}>
                                <label>{formatNumbers(ore())}</label>
                            </div>
                            <div class={styles.label_header + " " + displayModule.label_depth}>
                                <label>{formatNumbers(depth())}</label>
                            </div>
                            <div class={styles.label_header + " " + displayModule.label_diamond}>
                                <label>soon</label>
                            </div>
                        </div>
                    </div>
                </div>
                <div class={styles.main} onClick={() => {
                    void mine();
                    void playDigSound()
                }}>
                    <img src={game} class={styles.game} alt={"Game ground"}/>
                    <div class={styles.miner}></div>
                </div>
                <div class={styles.controls}>
                    <a class={styles.gear_normal + " " + styles.gear_left}/>
                    <a class={styles.gear_normal + " " + styles.gear_right}></a>
                    <Show when={showPVP()}
                          fallback={
                              <>
                                  <div class={styles.buttonitem}>
                                      <button onClick={(e) => {
                                          void playButtonSound();
                                          setShowPVP(true);
                                          hide();
                                          rotateGearIn();
                                      }} class={styles.button}>PVP
                                      </button>
                                  </div>
                              </>
                          }>
                        <div class={styles.slideIn}>
                            <div class={styles.image_container}>
                                <img src={board_right} class={styles.board_img_right} alt={"Control board"}/>
                                <button class={styles.button_close} onClick={() => {
                                    slideOut();
                                    window.setTimeout(function () {
                                        setShowPVP(false);
                                        unhide();
                                    }, 1300);
                                    rotateGearOut();
                                }}>
                                    <label class={styles.label_header + " " + styles.label_close}>X</label>
                                </button>
                                <a class={styles.label_board}>
                                    <label class={styles.label_header + " " + pvpModule.label_pvp}>PVP</label>
                                </a>
                                <button attLvl={'Lv' + attackLevel()}
                                        class={styles.button + " " + pvpModule.upgrade_attack}
                                        onClick={() => {
                                            void upgradeAttackLevel();
                                            subtractCost(formatNumbers(attackPrice()))
                                        }}><span>ATK</span>
                                    <a class={styles.icon_upgrade + " " + pvpModule.icon_upgrade_attack}></a>
                                </button>
                                <label
                                    class={styles.label_header + " " + pvpModule.label_attack_level}>{formatNumbers(attackPrice())}</label>
                                <a class={styles.ore + " " + pvpModule.attack_ore}></a>
                                <button defLvl={'Lv' + defenceLevel()}
                                        class={styles.button + " " + pvpModule.upgrade_defence}
                                        onClick={() => {
                                            void upgradeDefenceLevel();
                                            subtractCost(formatNumbers(defencePrice()))
                                        }}><span>DEF</span>
                                    <a class={styles.icon_upgrade + " " + pvpModule.icon_upgrade_defence}></a>
                                </button>
                                <label
                                    class={styles.label_header + " " + pvpModule.label_defence_level}>{formatNumbers(defencePrice())}</label>
                                <Show when={attacked()}
                                      fallback={<button class={styles.button + " " + pvpModule.pvp_attack}
                                                        onClick={attack}></button>}>
                                    <div class={pvpModule.pvp_clock}>
                                        <div class={pvpModule.firstHand}></div>
                                        <div class={pvpModule.secondHand}></div>
                                    </div>
                                    <span id={"timer"} class={styles.label_header + " " + styles.time}>00:10</span>
                                </Show>
                            </div>
                        </div>
                    </Show>

                    <Show when={showMining()}
                          fallback={
                              <>
                                  <div class={styles.buttonitem}>
                                      <button onClick={(e) => {
                                          void playButtonSound();
                                          setShowMining(true);
                                          hide();
                                          rotateGearIn();
                                          console.log("Automation: " + automation_on());
                                      }} class={styles.button}>Mining
                                      </button>
                                  </div>
                              </>
                          }>
                        <div class={styles.slideIn}>
                            <img src={board_right} class={styles.board_img_right} alt={"Control board"}/>
                            <button class={styles.button_close} onClick={() => {
                                if (automation_on()) {
                                    slideOutAutomate();
                                }
                                slideOut();
                                window.setTimeout(function () {
                                    setShowMining(false);
                                    unhide();
                                }, 1300);
                                rotateGearOut();
                            }}>
                                <label class={styles.label_header + " " + styles.label_close}>X</label>
                            </button>
                            <a class={styles.label_board}>
                                <label class={styles.label_header + " " + mineModule.label_mine}>Mining</label>
                            </a>
                            <button shovelSpeedLvl={'Lv' + shovelDepth()}
                                    class={styles.button + " " + mineModule.upgrade_speed}
                                    onClick={() => {
                                        void upgradeShovelDepth();
                                        subtractCost(formatNumbers(shovelDepthPrice()))
                                    }}><span>Depth</span>
                                <a class={styles.icon_upgrade + " " + mineModule.icon_upgrade_speed}></a>
                            </button>
                            <label
                                class={styles.label_header + " " + mineModule.label_speed_level}>{formatNumbers(shovelDepthPrice())}</label>

                            <button shovelAmountLvl={'Lv' + shovelAmount()}
                                    class={styles.button + " " + mineModule.upgrade_amount}
                                    onClick={() => {
                                        void upgradeShovelAmount();
                                        subtractCost(formatNumbers(shovelAmountPrice()))
                                    }}><span>Amount</span>
                                <a class={styles.icon_upgrade + " " + mineModule.icon_upgrade_amount}></a>
                            </button>
                            <label
                                class={styles.label_header + " " + mineModule.label_amount_level}>{formatNumbers(shovelAmountPrice())}</label>

                            <Show when={automation_on()}
                                  fallback={<>
                                      <button class={styles.button + " " + mineModule.automate}
                                              onClick={() => {
                                                  void automate();
                                                  subtractCost("200")
                                              }}>Automate
                                          <a class={styles.icon_upgrade + " " + mineModule.icon_automate}></a>
                                      </button>
                                      <label
                                          class={styles.label_header + " " + mineModule.label_automate_cost}>200</label>
                                  </>}>
                                <label class={styles.label_header + " " + mineModule.label_automate}>Automate On</label>
                                <div class={styles.slideIn_automate}>
                                    <div class={styles.image_container_automate}>
                                        <img src={small_board} class={styles.board_img_automate}
                                             alt={"Automate Board"}/>
                                        <a class={mineModule.auto_label_board}>
                                            <label
                                                class={styles.label_header + " " + mineModule.label_auto}>Automate</label>
                                        </a>
                                        <button autoDepthLvl={'Lv' + autoDepth()}
                                                class={styles.button + " " + mineModule.upgrade_automate_speed}
                                                onClick={() => {
                                                    void upgradeAutoDepth();
                                                    subtractCost(formatNumbers(autoDepthPrice()))
                                                }}><span>Depth</span>
                                            <a class={styles.icon_upgrade + " " + mineModule.icon_upgrade_automate_speed}></a>
                                        </button>
                                        <label
                                            class={styles.label_header + " " + mineModule.label_speed_automate_level}>{formatNumbers(autoDepthPrice())}</label>

                                        <button autoAmountLvl={'Lv' + autoAmount()}
                                                class={styles.button + " " + mineModule.upgrade_automate_amount}
                                                onClick={() => {
                                                    void upgradeAutoAmount();
                                                    subtractCost(formatNumbers(autoAmountPrice()))
                                                }}><span>Amount</span>
                                            <a class={styles.icon_upgrade + " " + mineModule.icon_upgrade_automate_amount}></a>
                                        </button>
                                        <label
                                            class={styles.label_header + " " + mineModule.label_amount_automate_level}>{formatNumbers(autoAmountPrice())}</label>
                                    </div>
                                </div>
                            </Show>
                        </div>
                    </Show>
                    <div class={styles.buttonitem}>
                        <button class={styles.button}>Rank</button>
                    </div>
                    <div class={styles.buttonitem}>
                        <button onClick={(e) => {setShowShop(true); void playButtonSound()}} class={styles.button}>Shop</button>
                    </div>
                        <Show when={showShop()}
                              fallback={""}>
                            <div class={shopModule.shop} use:clickOutside={() => setShowShop(false)}>
                                <div class={shopModule.shop_h}>
                                    <h3>Shop</h3>
                                </div>
                                <div class={shopModule.spacer}>
                                    <p>Backgrounds</p>
                                </div>
                                <div class={shopModule.items_container}>
                                    <div class={shopModule.item}>
                                        <div class={shopModule.tag_cherry}>
                                            <p class={shopModule.tag_p}>Cherry</p>
                                        </div>
                                        <div class={styles.buttonitem}>
                                            <button class={shopModule.button_buy}>1500</button>
                                        </div>
                                    </div>
                                    <div class={shopModule.item}>
                                        <div class={shopModule.tag_mixed}>
                                            <p class={shopModule.tag_p}>Mixed</p>
                                        </div>
                                        <div class={styles.buttonitem}>
                                            <button class={shopModule.button_buy}>699</button>
                                        </div>
                                    </div>
                                    <div class={shopModule.item}>
                                        <div class={shopModule.tag_spruce}>
                                            <p class={shopModule.tag_p}>Spruce</p>
                                        </div>
                                        <div class={styles.buttonitem}>
                                            <button class={shopModule.button_buy}>1500</button>
                                        </div>
                                    </div>
                                    <div class={shopModule.item}>
                                        <div class={shopModule.tag_universe_dark}>
                                            <p class={shopModule.tag_p}>Dark Star</p>
                                        </div>
                                        <div class={styles.buttonitem}>
                                            <button class={shopModule.button_buy}>2690</button>
                                        </div>
                                    </div>
                                    <div class={shopModule.item}>
                                        <div class={shopModule.tag_universe_light}>
                                            <p class={shopModule.tag_p}>Light Star</p>
                                        </div>
                                        <div class={styles.buttonitem}>
                                            <button class={shopModule.button_buy}>2690</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Show>

                    <Show when={showLoot()}>
                        <div class={styles.modal} use:clickOutside={() => setShowLoot(false)}>
                            <label style="font-size:30px"> Success! </label>
                            <label style="font-size:20px"> Your Loot:</label>
                            <div class={styles.grid_loot}>
                                <div class={styles.grid_loot_icon}></div>
                                <label class={styles.grid_loot_label} style="font-size:20px">{formatNumbers(loot())}</label>
                            </div>
                        </div>
                    </Show>

                    <Show when={showOfflineResources()}>
                        <div class={styles.modal} use:clickOutside={() => setShowOfflineResources(false)}>
                            <label style="font-size:30px"> Welcome back!</label>
                            <label style="font-size:20px">Your Offline Loot:</label>
                            <div class={styles.grid_ore}>
                                <div class={styles.grid_ore_icon}></div>
                                <label class={styles.grid_ore_label} style="font-size:20px">{formatNumbers(totalAmount())}</label>
                            </div>
                            <div class={styles.grid_depth}>
                                <div class={styles.grid_depth_icon}></div>
                                <label class={styles.grid_depth_label} style="font-size:20px">{formatNumbers(totalDepth())}</label>
                            </div>
                        </div>
                    </Show>
                </div>
            </div>
        </div>
    )
        ;
};

export default App;
