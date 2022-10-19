import type { Component } from "solid-js";
import logo from "./logo.svg";
import styles from "./App.module.css";
import Editor from "./pages/Editor";

const App: Component = () => {
	return (
		<div class={styles.App}>
			<div class={styles.container}>
				<Editor />
			</div>
		</div>
	);
};

export default App;
