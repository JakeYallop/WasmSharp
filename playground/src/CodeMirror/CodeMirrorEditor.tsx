import { Component, createSignal, onCleanup, onMount } from "solid-js";
import { debounce } from "@solid-primitives/scheduled";
import { basicSetup, EditorView } from "codemirror";
import { StreamLanguage } from "@codemirror/language";
import { linter, Diagnostic as CmDiagnostic } from "@codemirror/lint";
import { csharp } from "@codemirror/legacy-modes/mode/clike";
import "./CodeMirrorEditor.css";
import { Facet, Prec, StateField, Transaction } from "@codemirror/state";
import { ViewPlugin } from "@codemirror/view";
import { DiagnosticSeverity } from "@wasmsharp/core/wasm-exports";
import { Compiler } from "@wasmsharp/core";

const CodeMirrorEditor: Component<{
  onValueChanged?: (value: string) => void;
}> = (props) => {
  const [editor, setEditor] = createSignal<EditorView>();
  let editorRef: HTMLDivElement | undefined;

  onMount(() => {
    const initialDocument = `using System;

Console.WriteLine("Hello, world!");`;
    let hasUpdated = { value: true };
    const readUpdates = EditorView.updateListener.of(
      debounce((update) => {
        if (hasUpdated) {
          hasUpdated.value = false;
          const document = update.state.doc.toString();
          props.onValueChanged?.(document);
        }
      }, 800)
    );

    const updateCheck = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        hasUpdated.value = true;
      }
    });

    const e = new EditorView({
      doc: initialDocument,
      parent: editorRef!,
      extensions: [
        basicSetup,
        StreamLanguage.define(csharp),
        readUpdates,
        updateCheck,
        csharpCompilationField,
        csharpLinter(),
      ],
    });
    setEditor(e);
    props.onValueChanged?.(initialDocument);
  });

  onCleanup(() => editor()?.destroy());

  return <div style={{ height: "100%" }} ref={editorRef!}></div>;
};

type LintConfig = NonNullable<Parameters<typeof linter>[1]>;
interface CSharpLinterConfig extends LintConfig {}

const csharpCompilationField = StateField.define({
  create(state) {
    return {
      compilation: Compiler.createCompilation(state.doc.toString()),
    };
  },
  update(value, tr) {
    if (tr.docChanged) {
      value.compilation.recompile(tr.newDoc.toString());
    }
    return value;
  },
});

const csharpLinterSource = "@WasmSharp";

export const csharpLinter = (config?: CSharpLinterConfig) => {
  return linter((view) => {
    const diagnostics: CmDiagnostic[] = [];
    const field = view.state.field(csharpCompilationField);
    const compilation = field.compilation;
    var wasmSharpDiagnostics = compilation.getDiagnostics();

    console.log(`Diagnostics: ${wasmSharpDiagnostics.length}`);
    for (let i = 0; i < wasmSharpDiagnostics.length; i++) {
      const diagnostic = wasmSharpDiagnostics[i];
      diagnostics.push({
        from: diagnostic.location.start,
        to: diagnostic.location.end,
        message: diagnostic.message,
        severity: mapSeverity(diagnostic.severity),
        source: csharpLinterSource,
      });
    }

    return diagnostics;
  }, config);
};

const mapSeverity: (
  severity: DiagnosticSeverity
) => "info" | "warning" | "error" = (severity) => {
  switch (severity) {
    case "Error":
      return "error";
    case "Warning":
      return "warning";
    case "Information":
    case "Hidden":
    case "None":
      return "info";
  }
};

export default CodeMirrorEditor;
