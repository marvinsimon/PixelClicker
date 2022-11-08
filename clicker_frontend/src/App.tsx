import type { Component } from "solid-js";
import { createSignal, onCleanup, Show } from "solid-js";
import styles from "./App.module.css";
import { ClientMessages, ServerMessages } from "./game_messages";

const App: Component = () => {
  let password_field: HTMLInputElement;
  let email_field: HTMLInputElement;

  const [ore, setOre] = createSignal(0);
  const [auth, setAuth] = createSignal(false);
  const [depth, setDepth] = createSignal(0);
  //PopUp Variable
  const [show, setShow] = createSignal(false);
  const [shovel, setShovel] = createSignal(0);
  const [shovelAmount, setShovelAmount] = createSignal(0);

  let socket: WebSocket | undefined;
  const s = new WebSocket("ws://localhost:3001/game");

  const connectBackend = async () => {
    socket = s;
  };

  const disconnectBackend = () => {
    if (socket != null) {
      socket.close();
    }
  };

  const click = async () => {
    if (socket) {
      const event: ClientMessages = "Mine";
      await socket.send(JSON.stringify(event));

      s.onmessage = (msg) => {
        const event: ServerMessages = JSON.parse(msg.data as string);
        if ("NewState" in event) {
          console.log(event.NewState);
          setOre(event.NewState.ore);
          setDepth(event.NewState.depth);
        } else if ("ShovelDepthUpgraded" in event) {
          console.log(event.ShovelDepthUpgraded);
          setShovel(event.ShovelDepthUpgraded.new_level);
        } else if ("ShovelAmountUpgraded" in event) {
          console.log(event.ShovelAmountUpgraded);
          setShovelAmount(event.ShovelAmountUpgraded.new_level);
        }
      };
    }
  };

  const upgradeShovelAmount = async () => {
    if (socket) {
      const event: ClientMessages = "UpgradeShovelAmount";
      await socket.send(JSON.stringify(event));
    }
  };

  const upgradeShovelDepth = async () => {
    if (socket) {
      const event: ClientMessages = "UpgradeShovelDepth";
      await socket.send(JSON.stringify(event));
    }
  };

  const automate = async () => {
    if (socket) {
      const event: ClientMessages = "StartAutomation";
      await socket.send(JSON.stringify(event));
    }
  };

  const sign_up = async () => {
    let auth = btoa(`${email_field.value}:${password_field.value}`);
    const response = await fetch("http://localhost:3000/sign_up", {
      method: "GET",
      credentials: "include",
      headers: { Authorization: `Basic ${auth}` },
    });
    console.log(`sign_up: ${response.statusText}`);
    if (response.ok) {
      setAuth(true);
    }
  };

  const login = async () => {
    let auth = btoa(`${email_field.value}:${password_field.value}`);
    const response = await fetch("http://localhost:3001/login", {
      method: "GET",
      credentials: "include",
      headers: { Authorization: `Basic ${auth}` },
    });
    console.log(`login: ${response.statusText}`);
    if (response.ok) {
    }
  };

  const sign_out = async () => {
    if (auth()) {
      const response = await fetch("http://localhost:3000/log_out", {
        method: "GET",
        credentials: "include",
      });
      console.log(`sign_out: ${response.statusText}`);
      if (response.ok) {
        setAuth(false);
      }
    } else {
      console.log(`sign_out: failed`);
    }
  };

  function clickOutside(
    el: { contains: (arg0: any) => any },
    accessor: () => { (): any; new (): any }
  ) {
    const onClick = (e) => !el.contains(e.target) && accessor()?.();
    document.body.addEventListener("click", onClick);
  }

  onCleanup(() => document.body.removeEventListener("click", onClick));

  return (
    <div class={styles.App}>
      <header class={styles.header}>
        <button class={styles.button} onClick={connectBackend}>
          Connect
        </button>
        <button class={styles.button} onClick={disconnectBackend}>
          Disconnect
        </button>
        <br />
        <button class={styles.button} onClick={login}>
          Login
        </button>
        <button class={styles.button} onClick={click}>
          Mine Ore
        </button>
        <br />
        <button class={styles.button} onClick={upgradeShovelDepth}>
          Schaufelgeschwindigkeitslevel: {shovel()}{" "}
        </button>
        <br />
        <button class={styles.button} onClick={automate}>
          Automatisierung
        </button>
        <br />
        <button class={styles.button} onClick={upgradeShovelAmount}>
          Schaufelmengenlevel: {shovelAmount()}{" "}
        </button>
        <label>{ore()}</label>
        <label>Grabtiefe: {depth()}</label>
        <input type="text" placeholder="Your email" />
        <input type="password" placeholder="Your password" />
        <Show
          when={show()}
          fallback={
            <button onClick={(e) => setShow(true)} class={styles.button}>
              Sign Up
            </button>
          }
        >
          <div class={styles.modal} use:clickOutside={() => setShow(false)}>
            <h3>Sign Up</h3>
            <form>
              <label>Email</label>
              <input
                type="text"
                ref={email_field!}
                placeholder="Your email.."
              />
              <label>Password</label>
              <input
                type="password"
                ref={password_field!}
                placeholder="Your password.."
              />
              <input type="submit" value="Submit" onClick={sign_up} />
            </form>
          </div>
        </Show>
        <button class={styles.button} onClick={sign_out}>
          Abmelden
        </button>
      </header>
    </div>
  );
};

export default App;
