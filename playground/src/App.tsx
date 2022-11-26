import type { Component } from "solid-js";
import styles from "./App.module.css";
import Playground from "./pages/Editor";

const App: Component = () => {
  return (
    <div class={styles.App}>
      <div class={styles.container}>
        <Playground />
      </div>
    </div>
  );
};

export default App;