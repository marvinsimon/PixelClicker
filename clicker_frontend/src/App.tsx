import type {Component} from "solid-js";
import {createSignal, onCleanup, Show} from "solid-js";
import styles from "./App.module.css";
import {ClientMessages, I32, ServerMessages} from "./game_messages";
import clicker_logo from "./assets/ClickerRoyale_Wappen.png";
import board from "./assets/Brettmiticon.png";
import game from "./assets/Playground.png";
import {Portal} from "solid-js/web";

const App: Component = () => {

    let password_field: HTMLInputElement;
    let email_field: HTMLInputElement;

    const [ore, setOre] = createSignal(0);
    const [auth, setAuth] = createSignal(false);
    const [depth, setDepth] = createSignal(0);
    //PopUp Variable
    const [show, setShow] = createSignal(false);
    const [innershow, setInnerShow] = createSignal(false);
    const [shovelDepth, setShovelDepth] = createSignal(1);
    const [shovelAmount, setShovelAmount] = createSignal(1);
    const [automation_on, setAutomation] = createSignal(false);
    const [autoDepth, setAutoDepth] = createSignal(1);
    const [autoAmount, setAutoAmount] = createSignal(1);
    const [pvp, setPvp] = createSignal(false);
    const [attackLevel, setAttackLevel] = createSignal(1);
    const [defenceLevel, setDefenceLevel] = createSignal(1);
    const [loggedIn, setLoggedIn] = createSignal(false);
    const [bad_request_bool, setBad_request_bool] = createSignal(false);
    const [unauthorized, setUnauthorized] = createSignal(false);
    const [showMining, setShowMining] = createSignal(false);
    const [showPVP, setShowPVP] = createSignal(false);


    let socket: WebSocket | undefined;

    const connectBackend = async () => {
        if (socket != null)
            disconnectBackend();
        socket = new WebSocket("ws://localhost:3001/game");
        socket.onmessage = (msg) => {
            const event: ServerMessages = JSON.parse(msg.data as string);
            if ("NewState" in event) {
                console.log(event.NewState);
                setOre(event.NewState.ore);
                setDepth(event.NewState.depth);
            } else if ("ShovelDepthUpgraded" in event) {
                console.log(event.ShovelDepthUpgraded);
                setShovelDepth(event.ShovelDepthUpgraded.new_level);
            } else if ("ShovelAmountUpgraded" in event) {
                console.log(event.ShovelAmountUpgraded);
                setShovelAmount(event.ShovelAmountUpgraded.new_level);
            } else if ("AutomationDepthUpgraded" in event) {
                console.log(event.AutomationDepthUpgraded);
                setAutoDepth(event.AutomationDepthUpgraded.new_level);
            } else if ("AutomationAmountUpgraded" in event) {
                console.log(event.AutomationAmountUpgraded);
                setAutoAmount(event.AutomationAmountUpgraded.new_level);
            } else if ("AttackLevelUpgraded" in event) {
                console.log(event.AttackLevelUpgraded);
                setAttackLevel(event.AttackLevelUpgraded.new_level);
            } else if ("DefenceLevelUpgraded" in event) {
                console.log(event.DefenceLevelUpgraded);
                setDefenceLevel(event.DefenceLevelUpgraded.new_level);
            } else if ("LoginState" in event) {
                console.log(event.LoginState);
                setLoginStates(event.LoginState);
            }
        }
    }

    const setLoginStates = (LoginState: { shovel_amount: I32; shovel_depth: I32; automation_depth: I32; automation_amount: I32; attack_level: I32; defence_level: I32; automation_started: boolean }) => {
        setShovelDepth(LoginState.shovel_depth);
        setShovelAmount(LoginState.shovel_amount);
        setAutoAmount(LoginState.automation_amount);
        setAutoDepth(LoginState.automation_depth);
        setAutomation(LoginState.automation_started);
        setAttackLevel(LoginState.attack_level);
        setDefenceLevel(LoginState.defence_level);
    }

    const disconnectBackend = () => {
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
            setAutomation(true);
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
        setBad_request_bool(false);
        let auth = btoa(`${email_field.value}:${password_field.value}`);
        const response = await fetch("http://localhost:3001/sign_up", {
            method: "GET",
            credentials: "include",
            headers: {Authorization: `Basic ${auth}`},
        });
        console.log(`sign_up: ${response.statusText}`);
        if (response.ok) {
            setLoggedIn(true);
            setAuth(true);
            await connectBackend();
        } else if (response.status == 400) {
            setBad_request_bool(true);
            console.log('Bad Request');
        }
    }

    const login = async () => {
        if (!auth()) {
            disconnectBackend();
            setUnauthorized(false);
            let auth = btoa(`${email_field.value}:${password_field.value}`);
            const response = await fetch("http://localhost:3001/login", {
                method: "GET",
                credentials: "include",
                headers: {Authorization: `Basic ${auth}`},
            });
            console.log(`login: ${response.statusText}`);
            if (response.ok) {
                await connectBackend();
                setLoggedIn(true);
                setAuth(true);
                const event: ClientMessages = "GetLoginData";
                socket?.send(JSON.stringify(event));
            } else if (response.status == 401) {
                setUnauthorized(true);
                console.log('Unauthorized');
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

    const attack = async () => {
        const response = await fetch("http://localhost:3001/combat", {
            method: "GET",
            credentials: "include",
        });
    }

    return (

        <div class={styles.App}>
            <div class={styles.container}>
                <div class={styles.header}>
                    <img src={clicker_logo} class={styles.header_logo} alt={"ClickerRoyale Logo"}/>
                    <nav>
                        <Show when={!loggedIn()}
                              fallback={<button class={styles.button} onClick={() => {
                                  sign_out();
                                  setShow(false);
                                  setInnerShow(false)
                              }}>Ausloggen</button>}>
                            <button onClick={(e) => setShow(true)} class={styles.button}>SignUp</button>
                            <Show when={show()}
                                  fallback={""}>
                                <div class={styles.modal} use:clickOutside={() => setShow(false)}>
                                    <h3>SignUp</h3>
                                    <input type="text" ref={email_field!} style="width: 300px;"
                                           placeholder="Ihre E-mail.."/>
                                    <input type="password" ref={password_field!} style="width: 300px;"
                                           placeholder="Ihr Passwort.."/>
                                    <input type="submit" value="Sign Up" onClick={sign_up}/>
                                    <div class={styles.switch}>
                                        <p>Already signed up?</p>
                                        <button class={styles.buttonswitch} onClick={() => {
                                            setShow(false);
                                            setInnerShow(true)
                                        }}>Login
                                        </button>
                                    </div>
                                </div>
                            </Show>
                            <Show when={innershow()}
                                  fallback={""}>
                                <div class={styles.modal} use:clickOutside={() => setInnerShow(false)}>
                                    <h3>Login</h3>
                                    <input type="text" ref={email_field!} style="width: 300px;"
                                           placeholder="Ihre E-mail.."/>
                                    <input type="password" ref={password_field!} style="width: 300px;"
                                           placeholder="Ihr Passwort.."/>
                                    <input type="submit" value="Log In" onClick={login}/>
                                    <div class={styles.switch}>
                                        <p>Not registered?</p>
                                        <button class={styles.buttonswitch} onClick={() => {
                                            setShow(true);
                                            setInnerShow(false)
                                        }}>Sign Up
                                        </button>
                                    </div>
                                </div>
                            </Show>
                        </Show>
                    </nav>
                </div>
                <div class={styles.board}>
                    <img src={board} class={styles.board_img} alt={"Value board"}/>
                    <label class={styles.label_info}>{ore()}</label>
                    <label class={styles.label_info}>{depth()}</label>
                    <label class={styles.label_info}>coming soon</label>
                </div>
                <div class={styles.main} onClick={mine}>
                    <img src={game} class={styles.game} alt={"Game ground"}/>
                </div>
                <div class={styles.controls}>

                    <button class={styles.button} onClick={mine}>Erz abbauen</button>

                    <Show when={showPVP()}
                          fallback={<button onClick={(e) => setShowPVP(true)} class={styles.button_pvp}></button>}>
                        <div class={styles.modal} use:clickOutside={() => setShowPVP(false)}>
                            <h3>PvP Verbesserungen</h3>
                            <br/>
                            <button class={styles.button} onClick={upgradeAttackLevel}>Angriff: {attackLevel()}</button>
                            <button class={styles.button} onClick={upgradeDefenceLevel}>Verteidigung: {defenceLevel()}</button>
                        </div>
                    </Show>


                    <Show when={showMining()}
                          fallback={<button onClick={(e) => setShowMining(true)} class={styles.button_mine}></button>}>
                        <div class={styles.modal} use:clickOutside={() => setShowMining(false)}>
                            <h3>Mining Verbesserungen</h3>
                            <br/>
                            <button class={styles.button}
                                    onClick={upgradeShovelDepth}>Schaufelgeschwindigkeitslevel: {shovelDepth()} </button>
                            <button class={styles.button}
                                    onClick={upgradeShovelAmount}>Schaufelmengenlevel: {shovelAmount()} </button>
                            <br/>
                            <Show when={automation_on()}
                                  fallback={<button class={styles.button} onClick={automate}>Automatisierung</button>}>
                                <button class={styles.button} onClick={upgradeAutoDepth}>Automat
                                    Tiefe: {autoDepth()}</button>
                                <br/>
                                <button class={styles.button} onClick={upgradeAutoAmount}>Automat Erz
                                    Menge: {autoAmount()}</button>
                            </Show>
                        </div>
                    </Show>
                    <button class={styles.button_pvp_attack} onClick={attack}></button>
                    <button class={styles.button_rank}></button>
                    <button class={styles.button_shop}></button>


                </div>

                <div id={"popup"}>

                </div>
            </div>
        </div>
    );
};

export default App;
