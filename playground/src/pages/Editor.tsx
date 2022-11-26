import { Compiler } from "@wasmsharp/core";
import {
  children,
  Component,
  createEffect,
  createResource,
  createSignal,
  For,
  onCleanup,
  onMount,
  ParentComponent,
  ParentProps,
  Ref,
} from "solid-js";

import { basicSetup, EditorView } from "codemirror";
//TODO: Swap out for different theme
import { dracula } from "thememirror";
import { StreamLanguage } from "@codemirror/language";
import { csharp } from "@codemirror/legacy-modes/mode/clike";
import { Diagnostic } from "@wasmsharp/core/wasm-exports.js";
import "./Editor.css";

const LoadWasm: ParentComponent = (props) => {
  const [compilerInit] = createResource(() => Compiler.initAsync());
  return (
    <>
      {compilerInit.loading && (
        <h2>Loading compilation tools, please wait...</h2>
      )}
      {compilerInit.state === "errored" && <h2>Failed to load</h2>}
      {compilerInit.state === "ready" && props.children}
    </>
  );
};

const CodeMirror: Component<{
  onValueChanged?: (value: string) => void;
}> = (props) => {
  const [editor, setEditor] = createSignal<EditorView>();
  const [code, setCode] = createSignal<string>();
  let editorRef: HTMLDivElement | undefined;

  onMount(() => {
    const e = new EditorView({
      doc: 'using System;\n\nConsole.WriteLine("Hello, world!");',
      parent: editorRef!,
      dispatch: (transaction) => {
        e.update([transaction]);
        if (transaction.docChanged) {
          const document = transaction.state.doc.toString();
          props?.onValueChanged?.(document);
        }
      },
      extensions: [basicSetup, dracula, StreamLanguage.define(csharp)],
    });
    setEditor(e);
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

  createEffect(
    (prev) => {
      if (prev === props.code) {
        console.log("Skipping compilation as code is unchanged.");
        return;
      }
      compilation().recompile(props.code);
      setDiagnostics(compilation().getDiagnostics());
      setOutput(null);
    },
    { defer: true }
  );

  return (
    <div>
      <Diagnostics diagnostics={diagnostics()} />
      <button
        class="button primary icon"
        disabled={diagnostics().length > 0}
        onClick={() => {
          const result = compilation().run();
          if (result.success) {
            setOutput(result.stdOut);
          }
        }}
      >
        Run Code
        <img
          src="https://icongr.am/material/cog-clockwise.svg?color=white"
          alt="icon"
        />
      </button>
      {!!output() && (
        <>
          <h2>Output</h2>
          <pre>{output()}</pre>
        </>
      )}
    </div>
  );
};

const Diagnostics = (props: { diagnostics?: Diagnostic[] }) => {
  if (!props.diagnostics) {
    return <></>;
  }

  return (
    <>
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
    </>
  );
};

export default Playground;
