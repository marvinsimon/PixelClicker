import { Component, createEffect, createMemo, createSignal, Show } from 'solid-js';

import logo from './logo.svg';
import styles from './App.module.css';

const App: Component = () => {
  const [money, setMoney] = createSignal(0);

  const click = () => {
    setMoney(money()+1)
  }

  return (
    <div class={styles.App}>
      <header class={styles.header}>
        <button class={styles.buttons} onClick={click}>Upgrade</button>
        <br/>
        <label>{money()}</label>
      </header>
    </div>
  );
};

export default App;
