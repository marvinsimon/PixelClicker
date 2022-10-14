import type {Component} from 'solid-js';
import {createSignal} from "solid-js";
import styles from './App.module.css';
import {ServerMessages} from "./game_messages";

const App: Component = () => {

    const [ore, setOre] = createSignal(0);

    let socket: WebSocket | undefined;
    const connectBackend = async () => {
        const s = new WebSocket("ws://localhost:3001/game");
        s.onmessage = msg => {
            const event: ServerMessages = JSON.parse(msg.data as string);
            if ("NewState" in event) {
                console.log(event.NewState);
                setOre(event.NewState.ore);
            }
        }
        socket = s;
    }

    const disconnectBackend = () => {
        if (socket != null) {
            socket.close();
        }
    }

    return (
        <div class={styles.App}>
            <header class={styles.header}>
                <button class={styles.button} onClick={connectBackend}>Connect</button>
                <button class={styles.button} onClick={disconnectBackend}>Disconnect</button>
                <br/>
                <label>{ore()}</label>
            </header>
        </div>
    );
};

export default App;
