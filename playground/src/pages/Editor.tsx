import { Compiler } from "@wasmsharp/core";
import {
  Accessor,
  batch,
  children,
  Component,
  createEffect,
  createResource,
  createSignal,
  For,
  on,
  onCleanup,
  onMount,
  ParentComponent,
  ParentProps,
  Ref,
  Resource,
  Setter,
  Show,
} from "solid-js";

import { basicSetup, EditorView } from "codemirror";
//TODO: Swap out for different theme
import { dracula } from "thememirror";
import { StreamLanguage } from "@codemirror/language";
import { csharp } from "@codemirror/legacy-modes/mode/clike";
import { Diagnostic } from "@wasmsharp/core/wasm-exports.js";
import styles from "./Editor.module.css";
import "./Editor.css";
import { untrack } from "solid-js/web";

const LoadWasm: ParentComponent = (props) => {
  const [compilerInit] = createResource(() => Compiler.initAsync());
  return (
    <>
      <Show when={compilerInit.state === "pending"}>
        <h2>Loading compilation tools, please wait...</h2>
      </Show>
      <Show when={compilerInit.state === "errored"}>
        <h2>Failed to load, please refresh the page.</h2>
        <pre>{compilerInit.error.getManageStack()}</pre>
      </Show>
      <Show when={compilerInit.state === "ready"}>{props.children}</Show>
    </>
  );
};

const CodeMirror: Component<{
  onValueChanged?: (value: string) => void;
}> = (props) => {
  const [editor, setEditor] = createSignal<EditorView>();
  let editorRef: HTMLDivElement | undefined;

  onMount(() => {
    const initialDocument = `using System;

Console.WriteLine("Hello, world!");`;
    const readUpdates = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const document = update.state.doc.toString();
        props.onValueChanged?.(document);
      }
    });
    const e = new EditorView({
      doc: initialDocument,
      parent: editorRef!,
      extensions: [
        basicSetup,
        dracula,
        StreamLanguage.define(csharp),
        readUpdates,
      ],
    });
    setEditor(e);
    props.onValueChanged?.(initialDocument);
  });

  onCleanup(() => editor()?.destroy());

  return <div style={{ "max-height": "800px" }} ref={editorRef!}></div>;
};

const Playground: Component = () => {
  const [code, setCode] = createSignal<string | null>(null);
  const onValueChanged = (code: string) => {
    setCode(code);
  };
  return (
    <div>
      <CodeMirror onValueChanged={onValueChanged} />
      <CSharpRun code={code() || ""} />
    </div>
  );
};

const CSharpRun: Component<CSharpRunProps> = (props) => {
  return (
    <LoadWasm>
      <CSharpRunInitialized code={props.code} />
    </LoadWasm>
  );
};

interface CSharpRunProps {
  code: string;
}
const CSharpRunInitialized: Component<CSharpRunProps> = (
  props: CSharpRunProps
) => {
  const [output, setOutput] = createSignal<string | null>();
  const [diagnostics, setDiagnostics] = createSignal<Diagnostic[]>([]);
  const [compilation] = createSignal<Compiler>(
    Compiler.createCompilation(props.code)
  );

  createEffect((prev) => {
    if (prev === props.code) {
      console.log("Skipping compilation as code is unchanged.");
      return;
    }
    console.log("Recompiling");
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
        class={`button primary icon ${styles["run-button"]}`}
        disabled={diagnostics().length > 0}
        onClick={() => {
          const result = compilation().run();
          if (result.success) {
            setOutput(result.stdOut);
          }
        }}
      >
        Run Code
        <img src="https://icongr.am/material/cog-clockwise.svg" alt="icon" />
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
