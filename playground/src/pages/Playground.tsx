import { WasmSharpModule, type Diagnostic } from "@wasmsharp/core";
import { batch, Component, createEffect, createResource, createSignal, For, ParentComponent, Show } from "solid-js";

import CodeMirrorEditor from "../CodeMirror/CodeMirrorEditor.jsx";
import * as styles from "./Playground.css";

import playIcon from "../assets/play.svg";
import { Compilation } from "@wasmsharp/core";
import { debounce } from "@solid-primitives/scheduled";
import { CompletionContext, CompletionResult, CompletionSource, Completion } from "@codemirror/autocomplete";
import { WasmSharpOptions } from "@wasmsharp/core";
import ProgressBar from "../components/ProgressBar.jsx";

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
      <ProgressBar progress={loadedResources()} total={totalResources()} />
      <CodeMirrorEditor onValueChanged={onValueChanged} assemblyContext={context} />
      <Show when={wasmSharpModule.state === "pending"}>
        <h2>Loading compilation tools, please wait...</h2>
      </Show>
      <Show when={wasmSharpModule.state === "errored"}>
        <h2>Failed to load, please refresh the page.</h2>
        <pre>{wasmSharpModule.error?.getManageStack() ?? wasmSharpModule.error}</pre>
      </Show>
      <Show when={wasmSharpModule.state === "ready"}>
        <CSharpRun code={code() || ""} wasmSharpModule={wasmSharpModule.latest!} />
      </Show>
    </>
  );
};

interface CSharpRunProps {
  code: string;
  wasmSharpModule: WasmSharpModule;
}
const CSharpRun: Component<CSharpRunProps> = (props: CSharpRunProps) => {
  const [output, setOutput] = createSignal<string | null>();
  const [diagnostics, setDiagnostics] = createSignal<Diagnostic[]>([]);
  const [compilation] = createSignal<Compilation>(props.wasmSharpModule.createCompilation(props.code));

  createEffect((prev) => {
    if (prev === props.code) {
      console.log("Skipping compilation as code is unchanged.");
      return;
    }
    console.log("recompiling and fetching diagnostics");
    compilation().recompile(props.code);
    compilation()
      .getDiagnosticsAsync()
      .then((diagnostics) => {
        setDiagnostics(diagnostics);
      });
    setOutput(null);
    return props.code;
  });

  return (
    <div>
      <Diagnostics diagnostics={diagnostics()} />
      <button
        class={`${styles.runButton} button primary icon`}
        disabled={diagnostics().filter((x) => x.severity == "Error").length > 0}
        onClick={async () => {
          const result = await compilation().run();
          if (result.success) {
            setOutput(result.stdOut);
          } else {
            console.error(`Program failed to run.
${result.diagnostics.map((x) => JSON.stringify(x, undefined, "  ")).join("\n")}`);

            setDiagnostics(result.diagnostics);
          }
        }}
      >
        Run Code
        <img src={playIcon} alt="run icon" />
      </button>
      <Show when={output()}>
        <h2>Output</h2>
        <pre>{output()}</pre>
      </Show>
    </div>
  );
};

interface DiagnosticsProps {
  diagnostics?: Diagnostic[];
}
const Diagnostics: Component<DiagnosticsProps> = (props) => {
  const [showDiagnostics, setShowDiagnostics] = createSignal(false);
  createEffect(() => {
    setShowDiagnostics(!!props.diagnostics && props.diagnostics.length > 0);
  });

  return (
    <Show when={showDiagnostics()}>
      <h2>Diagnostics</h2>
      <For each={props.diagnostics}>
        {(diagnostic, i) => {
          const copy = JSON.parse(JSON.stringify(diagnostic));
          delete copy.location;
          return (
            //TODO: Update to use theme spacing
            <pre style={{ margin: "5px 0" }}>{JSON.stringify(copy, undefined, "  ")}</pre>
          );
        }}
      </For>
    </Show>
  );
};

export default Playground;
