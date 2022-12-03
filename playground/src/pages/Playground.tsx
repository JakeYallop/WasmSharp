import { AssemblyContext } from "@wasmsharp/core";
import {
  batch,
  Component,
  createEffect,
  createResource,
  createSignal,
  For,
  ParentComponent,
  Show,
} from "solid-js";

import { Diagnostic } from "@wasmsharp/core/wasm-exports.js";
import CodeMirrorEditor from "../CodeMirror/CodeMirrorEditor.jsx";
import * as styles from "./Playground.css";

import playIcon from "../assets/play.svg";
import { Compilation } from "@wasmsharp/core";

const LoadWasm: ParentComponent = (props) => {
  const [compilerInit] = createResource(() => AssemblyContext.createAsync());
  return (
    <>
      <Show when={compilerInit.state === "pending"}>
        <h2>Loading compilation tools, please wait...</h2>
      </Show>
      <Show when={compilerInit.state === "errored"}>
        <h2>Failed to load, please refresh the page.</h2>
        <pre>{compilerInit.error?.getManageStack() ?? compilerInit.error}</pre>
      </Show>
      <Show when={compilerInit.state === "ready"}>{props.children}</Show>
    </>
  );
};

const Playground: Component = () => {
  const context = AssemblyContext.createAsync();
  const [assemblyContext] = createResource(() => context);

  const [code, setCode] = createSignal<string | null>(null);
  const onValueChanged = (code: string) => {
    setCode(code);
  };
  return (
    <>
      <CodeMirrorEditor
        onValueChanged={onValueChanged}
        assemblyContext={context}
      />
      <Show when={assemblyContext.state === "pending"}>
        <h2>Loading compilation tools, please wait...</h2>
      </Show>
      <Show when={assemblyContext.state === "errored"}>
        <h2>Failed to load, please refresh the page.</h2>
        <pre>
          {assemblyContext.error?.getManageStack() ?? assemblyContext.error}
        </pre>
      </Show>
      <Show when={assemblyContext.state === "ready"}>
        <CSharpRun
          code={code() || ""}
          assemblyContext={assemblyContext.latest!}
        />
      </Show>
    </>
  );
};

interface CSharpRunProps {
  code: string;
  assemblyContext: AssemblyContext;
}
const CSharpRun: Component<CSharpRunProps> = (props: CSharpRunProps) => {
  const [output, setOutput] = createSignal<string | null>();
  const [diagnostics, setDiagnostics] = createSignal<Diagnostic[]>([]);
  const [compilation] = createSignal<Compilation>(
    props.assemblyContext.createCompilation(props.code)
  );

  createEffect((prev) => {
    if (prev === props.code) {
      console.log("Skipping compilation as code is unchanged.");
      return;
    }
    batch(() => {
      compilation().recompile(props.code);
      setDiagnostics(compilation().getDiagnostics());
      setOutput(null);
    });
    return props.code;
  });

  return (
    <div>
      <Diagnostics diagnostics={diagnostics()} />
      <button
        class={`${styles.runButton} button primary icon`}
        disabled={diagnostics().length > 0}
        onClick={() => {
          const result = compilation().run();
          if (result.success) {
            setOutput(result.stdOut);
          }
        }}
      >
        Run Code
        <img src={playIcon} alt="icon" />
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
            <pre style={{ margin: "5px 0" }}>
              {JSON.stringify(copy, undefined, "  ")}
            </pre>
          );
        }}
      </For>
    </Show>
  );
};

export default Playground;
