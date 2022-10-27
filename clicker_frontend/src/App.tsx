import type {Component} from 'solid-js';
import {createSignal} from "solid-js";
import styles from './App.module.css';
import {ServerMessages, ClientMessages} from "./game_messages";

const App: Component = () => {
    let password_field: HTMLInputElement;
    let email_field: HTMLInputElement;

    const [ore, setOre] = createSignal(0);
    const [auth, setAuth] = createSignal(false);
    const [depth, setDepth] = createSignal(0);
    //PopUp Variable
    const [show, setShow] = createSignal(false);
    const [shovel, setShovel] = createSignal(0);

    let socket: WebSocket | undefined;
    const s = new WebSocket("ws://localhost:3001/game");
    const connectBackend = async () => {


        socket = s;
    }

    const disconnectBackend = () => {
        if (socket != null) {
            socket.close();
        }
    }

    const click = async () => {
        if (socket){
            const event: ClientMessages = "Mine";
            await socket.send(JSON.stringify(event))

            s.onmessage = msg => {
                const event: ServerMessages = JSON.parse(msg.data as string);
                if ("NewState" in event) {
                    console.log(event.NewState);
                    setOre(event.NewState.ore);
                    setDepth(event.NewState.depth);
                }
                else if ("ShovelLevel"in event){
                    console.log(event.ShovelLevel);
                    setShovel(event.ShovelLevel.level);
                }
                else if ("ShovelDepthUpgraded"in event){
                    console.log(event.ShovelDepthUpgraded);
                    setShovel(event.ShovelDepthUpgraded.new_level);
                }
            }
        }
    }
    const upgradeShovel = async () => {
        if (socket){
            const event: ClientMessages = "UpgradeShovelDepth";
            await socket.send(JSON.stringify(event));
        }
    }

    const automate = async () => {
        if (socket){
            const event: ClientMessages = "StartAutomation";
            await socket.send(JSON.stringify(event));
        }
    }

    const sign_up = async () => {
        let auth = btoa(`${email_field.value}:${password_field.value}`);
        const response = await fetch("http://localhost:3000/sign_up", {
            method: "GET",
            credentials: "include",
            headers: {"Authorization": `Basic ${auth}`}
        });
        console.log(`sign_up: ${response.statusText}`);
        if (response.ok) {
            setAuth(true);
        }
    };

    }
    const login = async () => {
        let auth = btoa(`${email_field.value}:${password_field.value}`);
        const response = await fetch("http://localhost:3001/login", {
            method: "GET",
            credentials: "include",
            headers: {"Authorization": `Basic ${auth}`}
        });
        console.log(`login: ${response.statusText}`);
        if (response.ok) {
    function clickOutside(el: { contains: (arg0: any) => any; }, accessor: () => { (): any; new(): any; }) {
        const onClick = (e) => !el.contains(e.target) && accessor()?.();
        document.body.addEventListener("click", onClick);

        }
        onCleanup(() => document.body.removeEventListener("click", onClick));
    }

    return (
        <div class={styles.App}>
            <header class={styles.header}>
                <button class={styles.button} onClick={connectBackend}>Connect</button>
                <button class={styles.button} onClick={disconnectBackend}>Disconnect</button>
                <br/>
                <button class={styles.button} onClick={click}>Login</button>
                <button class={styles.button} onClick={click}>Mine Ore</button>
                <br/>
                <button class={styles.button} onClick={upgradeShovel}>Schaufelgeschwindigkeitslevel: {shovel()} </button>
                <button class={styles.button} onClick={automate}>Automatisierung</button>
                <label>{ore()}</label>
                <label>Grabtiefe: {depth()}</label>
                <input type="text" placeholder="Your email"/>
                <input type="text" placeholder="Your password"/>
                <Show when={show()} fallback={<button onClick={(e) => setShow(true)} class={styles.button}>Sign Up</button>}>
                    <div class={styles.modal} use:clickOutside={() => setShow(false)}>
                        <h3>Sign Up</h3>
                        <form>
                            <label>Email</label>
                            <input type="text" ref={email_field!} placeholder="Your email.."/>
                            <label>Password</label>
                            <input type="text" ref={password_field!} placeholder="Your password.."/>
                            <input type="submit" value="Submit" onClick={sign_up}/>
                        </form>
                    </div>
                </Show>
            </header>
        </div>
    );
};

export default App;
