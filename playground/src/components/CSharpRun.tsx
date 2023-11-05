import { WasmSharpModule, type Diagnostic } from "@wasmsharp/core";
import { Component, createEffect, createSignal, Show } from "solid-js";
import * as styles from "./CSharpRun.css";
import playIcon from "../assets/play.svg";
import { Compilation } from "@wasmsharp/core";
import { Diagnostics } from "./Diagnostics";

export interface CSharpRunProps {
  code: string;
  wasmSharpModule: WasmSharpModule;
}
export const CSharpRun: Component<CSharpRunProps> = (props: CSharpRunProps) => {
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
