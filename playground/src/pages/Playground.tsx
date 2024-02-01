import { WasmSharpModule } from "@wasmsharp/core";
import { batch, Component, createResource, createSignal, Show } from "solid-js";

import CodeMirrorEditor from "../CodeMirror/CodeMirrorEditor.jsx";

import { debounce } from "@solid-primitives/scheduled";
import { WasmSharpOptions } from "@wasmsharp/core";
import ProgressBar from "../components/ProgressBar.jsx";
import TwoPaneView from "../components/TwoPaneVIew.jsx";
import { CSharpRun } from "../components/CSharpRun.jsx";
import { spacing } from "../themeUtils.js";
import * as styles from "./Playground.css";

const Playground: Component = () => {
  const wasmSharpOptions: WasmSharpOptions = {
    onDownloadResourceProgress(loadedResources, totalResources) {
      batch(() => {
        setLoadedResources(totalResources);
        setTotalResources(loadedResources);
      });
    },
  };

  const context = WasmSharpModule.initializeAsync(wasmSharpOptions);
  const [loadedResources, setLoadedResources] = createSignal(0);
  const [totalResources, setTotalResources] = createSignal(0);
  const [wasmSharpModule] = createResource(() => context);

  const [code, setCode] = createSignal<string | null>(null);
  const onValueChanged = debounce((code: string) => {
    setCode(code);
  }, 1000);
  return (
    <>
      <Show when={loadedResources() != totalResources()}>
        <div class={styles.pogressBarContainer}>
          <ProgressBar progress={loadedResources()} total={totalResources()} />
        </div>
      </Show>
      <TwoPaneView>
        <CodeMirrorEditor onValueChanged={onValueChanged} wasmSharpModule={context} />
        <div>
          <Show when={wasmSharpModule.state === "pending"}>
            <h2 style={{ "margin-left": spacing(3) }}>Loading compilation tools, please wait...</h2>
          </Show>
          <Show when={wasmSharpModule.state === "ready"}>
            <CSharpRun code={code() || ""} wasmSharpModule={wasmSharpModule.latest!} />
          </Show>
        </div>
      </TwoPaneView>
      <Show when={wasmSharpModule.state === "errored"}>
        <h2>Failed to load, please refresh the page.</h2>
        <pre>{wasmSharpModule.error?.getManageStack?.() ?? wasmSharpModule.error}</pre>
      </Show>
    </>
  );
};

export default Playground;
