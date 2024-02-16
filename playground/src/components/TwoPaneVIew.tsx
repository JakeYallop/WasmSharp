import { batch, children, createRenderEffect, createSignal, onMount } from "solid-js";
import { JSX } from "solid-js/jsx-runtime";
import * as styles from "./TwoPaneView.css";
import { clsx } from "clsx";

interface TwoPaneViewProps {
  children: [JSX.Element, JSX.Element];
  containerStyle?: string;
  leftStyle?: string;
  rightStyle?: string;
  separatorStyle?: string;
  disableResponsiveLayout?: boolean;
}

function TwoPaneView(props: TwoPaneViewProps) {
  const c = children(() => props.children).toArray();
  if (c.length !== 2) {
    throw new Error("Expected exactly 2 children.");
  }

  const [leftWidth, setLeftWidth] = createSignal(50);
  const [isPortrait, setIsPortrait] = createSignal(window.innerHeight > window.innerWidth);
  const [leftContent, setLeftContent] = createSignal<JSX.Element>();
  const [rightContent, setRightContent] = createSignal<JSX.Element>();

  createRenderEffect(() => {
    batch(() => {
      setLeftContent(c[0]);
      setRightContent(c[1]);
    });
  });

  let separator: HTMLDivElement;

  const onMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    document.body.style.cursor = isPortrait() ? "row-resize" : "col-resize";
    const onMouseMove = (e: MouseEvent) => {
      const newLeftWidth = isPortrait()
        ? (e.clientY / window.innerHeight) * 100
        : (e.clientX / window.innerWidth) * 100;
      setLeftWidth(newLeftWidth);
    };

    window.addEventListener("mousemove", onMouseMove);

    const onMouseUp = () => {
      document.body.style.cursor = "";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mouseup", onMouseUp);
  };

  onMount(() => {
    if (!separator) return;
    separator.addEventListener("mousedown", onMouseDown);

    //TODO: Check if container queries are supported, and use those instead of a resize event
    const onResize = () => {
      document.body.style.cursor = "";
      setIsPortrait(props.disableResponsiveLayout ? false : window.innerHeight > window.innerWidth);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      document.body.style.cursor = "";
    };
  });

  return (
    <div style={{ "flex-direction": `${isPortrait() ? "column" : "row"}` }} class={styles.twoPaneViewContainer}>
      <div style={{ "flex-basis": `${leftWidth()}%` }}>{leftContent()}</div>
      <div
        ref={separator!}
        class={clsx(isPortrait() ? styles.verticalSeparator : styles.horizontalSeparator, props.separatorStyle)}
      />
      <div style={{ "flex-basis": `${100 - leftWidth()}%` }}>{rightContent()}</div>
    </div>
  );
}

export default TwoPaneView;
