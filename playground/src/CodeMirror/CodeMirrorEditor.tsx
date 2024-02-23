import { Component, createSignal, onCleanup, onMount } from "solid-js";
import { basicSetup, EditorView } from "codemirror";
import { linter, Diagnostic as CmDiagnostic } from "@codemirror/lint";
import "./CodeMirrorEditor.css";
import { EditorState, Facet, StateEffect, StateField, Transaction } from "@codemirror/state";
import { Compilation, CompletionItem, DiagnosticSeverity, WasmSharpModule, WellKnownTagArray } from "@wasmsharp/core";
import { CompletionContext, CompletionResult, autocompletion, Completion } from "@codemirror/autocomplete";
import { csharp } from "@replit/codemirror-lang-csharp";
import { ViewPlugin } from "@codemirror/view";
import "./CodeMirrorEditor.autocomplete.css";
import { darkModern } from "./dark-theme";

export interface CodeMirrorEditorProps {
  onValueChanged?: (value: string) => void;
  wasmSharpModule: Promise<WasmSharpModule>;
}
const CodeMirrorEditor: Component<CodeMirrorEditorProps> = (props) => {
  const [editor, setEditor] = createSignal<EditorView>();
  let editorRef: HTMLDivElement | undefined;

  onMount(() => {
    const initialDocument = `using System;
    using System.Reflection.Emit;
    
    while (true) { }
    
    return;
    //or remove the return to use the code below
    
    var method = new DynamicMethod("Test", typeof(void), Array.Empty<Type>());
    ILGenerator il = method.GetILGenerator(32);
    var loopTarget = il.DefineLabel();
    il.MarkLabel(loopTarget);
    il.Emit(OpCodes.Br_S, loopTarget);
    
    var MyMethod = method.CreateDelegate<InfiniteLoop>();
    
    MyMethod();
    
    delegate void InfiniteLoop();`;
    const readUpdates = EditorView.updateListener.of((update) => {
      const document = update.state.doc.toString();
      props.onValueChanged?.(document);
    });

    const e = new EditorView({
      doc: initialDocument,
      parent: editorRef!,
      extensions: [
        basicSetup,
        csharp(),
        darkModern,
        readUpdates,
        wasmSharp(props.wasmSharpModule),
        csharpLinter({ delay: 0 }),
        autocompletion({ override: [csharpCompletionSource] }),
      ],
    });
    setEditor(e);
    props.onValueChanged?.(initialDocument);
  });

  onCleanup(() => editor()?.destroy());

  return <div style={{ height: "100%" }} ref={editorRef!}></div>;
};

async function csharpCompletionSource(context: CompletionContext): Promise<CompletionResult | null> {
  const compilation = getCompilation(context.state);
  if (!compilation) {
    return null;
  }

  const from = context.pos;
  const completions = await compilation.getCompletions(from);

  const matchContext = context.matchBefore(/[\w\d]+/);
  const prefixUpper = matchContext?.text.toUpperCase();
  const filteredCompletions = prefixUpper
    ? completions.filter((x) => {
        const upper = x.filterText.toUpperCase();
        return upper.startsWith(prefixUpper) && upper !== prefixUpper;
      })
    : completions;

  const mappedCompletions = filteredCompletions.map(mapCompletionItemToCodeMirrorCompletion);
  return {
    from: matchContext?.from ?? from,
    options: mappedCompletions,
    filter: false,
  };
}

function mapCompletionItemToCodeMirrorCompletion(item: CompletionItem): Completion {
  return {
    label: item.displayText,
    detail: item.inlineDescription,
    type: mapTextTagsToType(item.tags),
  };
}

function mapTextTagsToType(tags: WellKnownTagArray) {
  if (process.env.NODE_ENV === "development") {
    //@ts-expect-error
    if (tags.length === 0) {
      console.warn(`No tag found for completion, falling back to "keyword".`);
      return "keyword";
    }
  }

  if (tags.length == 1) {
    return tags[0].toLowerCase();
  }
  return `${tags[0].toLowerCase()}-${tags[1].toLowerCase()}`;
}

type LintConfig = NonNullable<Parameters<typeof linter>[1]>;
interface CSharpLinterConfig extends LintConfig {}

const wasmSharpModulePromiseFacet = Facet.define<Promise<WasmSharpModule>>({
  static: true,
});

export const wasmSharpCompilationFacet = Facet.define<Compilation | null>({
  static: true,
});

const wasmSharp = (module: Promise<WasmSharpModule>) => {
  const facet = wasmSharpModulePromiseFacet.of(module);
  return [wasmSharpStateField.extension, facet, waitForModuleAndCreateCompilation.extension];
};

const compilationReadyEffect = StateEffect.define<Compilation>();

const waitForModuleAndCreateCompilation = ViewPlugin.define((state) => {
  return {
    update(update) {
      const field = update.state.field(wasmSharpStateField);
      if (field.ready) {
        return;
      }

      if (!field.modulePending) {
        //not sure if this is actually allowed, or if we should dispatch a transaction for this - seems to work for the moment though
        //and ensures we call createCompilationAsync only once.
        field.modulePending = true;
        const wasmSharpModulePromise = update.state.facet(wasmSharpModulePromiseFacet)[0];
        if (wasmSharpModulePromise) {
          wasmSharpModulePromise
            .then((module) => {
              console.log("Calling createCompilation");
              return module.createCompilationAsync("");
            })
            .then((compilation) => update.view.dispatch({ effects: compilationReadyEffect.of(compilation) }));
        }
      }
    },
  };
});

//TODO: investiage Facet.from as a possible simplification
const wasmSharpStateField = StateField.define({
  create(state) {
    return {
      modulePending: false,
      ready: false,
      compilation: null as Compilation | null,
    };
  },
  update(value, tr) {
    if (!value.ready) {
      for (const effect of tr.effects) {
        if (effect.is(compilationReadyEffect)) {
          value.compilation = effect.value;
          value.ready = true;
        }
      }
    }

    if (value.ready && tr.docChanged) {
      value.compilation!.recompileAsync(tr.newDoc.toString());
    }
    return value;
  },
});

const csharpLinterSource = "@WasmSharp";

function getCompilation(state: EditorState) {
  return state.field(wasmSharpStateField).compilation;
}

export const csharpLinter = (config?: CSharpLinterConfig) => {
  return linter(async (view) => {
    const diagnostics: CmDiagnostic[] = [];
    const compilation = getCompilation(view.state);
    if (!compilation) {
      console.debug("Skipping linting as compilation has not finished initialising");
      return [];
    }
    var wasmSharpDiagnostics = await compilation.getDiagnosticsAsync();

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

const mapSeverity: (severity: DiagnosticSeverity) => "info" | "warning" | "error" = (severity) => {
  switch (severity) {
    case "Error":
      return "error";
    case "Warning":
      return "warning";
    case "Info":
    case "Hidden":
      return "info";
    default:
      return "info";
  }
};

export default CodeMirrorEditor;
