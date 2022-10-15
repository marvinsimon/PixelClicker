import type {Component} from 'solid-js';
import {createSignal} from "solid-js";
import styles from './App.module.css';
import {ServerMessages, ClientMessages} from "./game_messages";
import {Portal} from "solid-js/web";
import Dismiss from "solid-dismiss";

const App: Component = () => {

    const [ore, setOre] = createSignal(0);
    const [open, setOpen] = createSignal(false);
    let btnEl;
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
                }
            }
        }
    }

    const dropdown = () => {
        const [open, setOpen] = createSignal(false);
        let btnEl;

        return (
            <div style="position: relative;">
                <button ref={btnEl}>Button</button>
                <Dismiss
                    menuButton={btnEl}
                    open={open}
                    setOpen={setOpen}
                    cursorKeys
                >
                    <ul class="dropdown">
                        <li><a href="#">cat</a></li>
                        <li><a href="#">dog</a></li>
                        <li><a href="#">fish</a></li>
                    </ul>
                </Dismiss>
            </div>
        );
    };

    return (
        <div class={styles.App}>
            <header class={styles.header}>


                <button class={styles.button} onClick={connectBackend}>Connect</button>
                <button class={styles.button} onClick={disconnectBackend}>Disconnect</button>
                <br/>
                <button class={styles.button} onClick={click}>Mine Ore</button>
                <br/>
                <label>{ore()}</label>
                <br/>
                <button class={styles.button} ref={btnEl}>Popup</button>
                <Dismiss
                    menuButton={btnEl}
                    open={open}
                    setOpen={setOpen}
                >
                    <div class={styles.popup}>
                        <p>Popup text!</p>
                        <p>Lorem, <a href="#">ipsum</a> dolor.</p>
                    </div>
                </Dismiss>
            </header>
        </div>
    );
};

export default App;
