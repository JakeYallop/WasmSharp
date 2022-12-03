import { Component, createSignal, onCleanup, onMount } from "solid-js";
import { debounce } from "@solid-primitives/scheduled";
import { basicSetup, EditorView } from "codemirror";
import { StreamLanguage } from "@codemirror/language";
import { linter, Diagnostic as CmDiagnostic } from "@codemirror/lint";
import { csharp } from "@codemirror/legacy-modes/mode/clike";
import "./CodeMirrorEditor.css";
import {
  Annotation,
  Facet,
  Prec,
  StateEffect,
  StateField,
  Transaction,
} from "@codemirror/state";
import { ViewPlugin } from "@codemirror/view";
import { DiagnosticSeverity } from "@wasmsharp/core/wasm-exports";
import { AssemblyContext, Compilation } from "@wasmsharp/core";

export interface CodeMirrorEditorProps {
  onValueChanged?: (value: string) => void;
  assemblyContext: Promise<AssemblyContext>;
}
const CodeMirrorEditor: Component<CodeMirrorEditorProps> = (props) => {
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
        wasmSharpField(props.assemblyContext),
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

const wasmSharpField = (assemblyContext: Promise<AssemblyContext>) => {
  const ref = { value: null } as { value: AssemblyContext | null };
  assemblyContext.then((c) => (ref.value = c));
  const facet = assemblyContextFacet.of(() => {
    return ref.value;
  });
  return [csharpCompilationField.extension, facet];
};

const assemblyContextFacet = Facet.define<() => AssemblyContext | null>({
  static: true,
});

const csharpCompilationField = StateField.define<CompilationObject>({
  create(state) {
    return {
      ready: false,
      compilation: null as Compilation | null,
    };
  },
  update(value, tr) {
    if (!value.ready) {
      const compilation = tr.state.facet(assemblyContextFacet)[0]();
      if (compilation) {
        value.ready = true;
        value.compilation = compilation.createCompilation("");
      }
    }

    if (tr.docChanged && value.ready) {
      value.compilation?.recompile(tr.newDoc.toString());
    }
    return value;
  },
});

const csharpLinterSource = "@WasmSharp";

interface CompilationObject {
  compilation: Compilation | null;
  ready: boolean;
}

type NonNullableCompilationObject<T> = { [K in keyof T]: NonNullable<T[K]> };

function isCompilationReady<T extends CompilationObject>(
  compilationObject: T
): compilationObject is NonNullableCompilationObject<T> {
  return compilationObject.ready;
}

export const csharpLinter = (config?: CSharpLinterConfig) => {
  return linter((view) => {
    const diagnostics: CmDiagnostic[] = [];
    const field = view.state.field(csharpCompilationField);
    if (!isCompilationReady(field)) {
      return [];
    }
    var wasmSharpDiagnostics = field.compilation.getDiagnostics();

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
