import { Diagnostic } from "@wasmsharp/core";
import { Component, createEffect, createSignal, For, Show } from "solid-js";
import { spacing } from "../themeUtils";

export interface DiagnosticsProps {
  diagnostics?: Diagnostic[];
}
export const Diagnostics: Component<DiagnosticsProps> = (props) => {
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
          return <pre style={{ margin: `${spacing(0.75)} 0` }}>{JSON.stringify(copy, undefined, "  ")}</pre>;
        }}
      </For>
    </Show>
  );
};
