import type {Component} from 'solid-js';
import {createSignal} from "solid-js";
import styles from './App.module.css';
import {ServerMessages, ClientMessages} from "./game_messages";
import {Portal} from "solid-js/web";
import Dismiss from "solid-dismiss";

const App: Component = () => {
    let password_field: HTMLInputElement;
    let email_field: HTMLInputElement;

    const [ore, setOre] = createSignal(0);
    const [auth, setAuth] = createSignal(false);

    //PopUp variables
    let btnEl;
    const [open, setOpen] = createSignal(false);

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

    const sign_up = async () => {

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
                <button class={styles.button} ref={btnEl}>Sign Up</button>
                <Dismiss menuButton={btnEl} open={open} setOpen={setOpen}>
                    <div class={styles.popup}>
                        <p>Sign Up</p>
                        <br/>
                        <label>Email</label> <input ref={email_field!} type="text"/>
                        <br/>
                        <br/>
                        <br/>
                        <label>Password</label> <input ref={password_field!} type="text"/>
                        <br/>
                        <br/>
                        <br/>
                        <br/>
                        <br/>
                        <button class={styles.submitbutton} onClick={sign_up}>Submit</button>
                        <br/>
                        <br/>
                        <p>Already registered? <a href="http://localhost:3001/login">Log in</a></p>
                    </div>
                </Dismiss>
            </header>
        </div>
    );
};

export default App;
