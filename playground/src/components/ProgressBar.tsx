import { Component, batch, createEffect, createSignal } from "solid-js";
import * as styles from "./ProgressBar.css";

export interface ProgressBarProps {
  progress: number;
  total: number;
}
const ProgressBar: Component<ProgressBarProps> = (props: ProgressBarProps) => { 
  const [width, setWidth] = createSignal(0);
  
  createEffect(() => {
      setWidth((props.total / props.progress) * 100)
  })


  return (
    <div class={styles.container}>
      <div style={{
        width: `${width()}%`
      }} class={styles.progressBar}></div>
    </div>
  );
};

export default ProgressBar;