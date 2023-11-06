import { Component, createSignal, onCleanup, onMount } from "solid-js";
import { basicSetup, EditorView } from "codemirror";
import { linter, Diagnostic as CmDiagnostic } from "@codemirror/lint";
import "./CodeMirrorEditor.css";
import { EditorState, Facet, StateField } from "@codemirror/state";
import { TextTag } from "../../../packages/core/src/WasmSharp.Core/dist/Roslyn/TextTags";
import { Compilation, CompletionItem, DiagnosticSeverity, WasmSharpModule } from "@wasmsharp/core";
import { CompletionContext, CompletionResult, autocompletion, Completion } from "@codemirror/autocomplete";
import { csharp } from "@replit/codemirror-lang-csharp";
import { oneDark } from "@codemirror/theme-one-dark";

export interface CodeMirrorEditorProps {
  onValueChanged?: (value: string) => void;
  wasmSharpModule: Promise<WasmSharpModule>;
}
const CodeMirrorEditor: Component<CodeMirrorEditorProps> = (props) => {
  const [editor, setEditor] = createSignal<EditorView>();
  let editorRef: HTMLDivElement | undefined;

  onMount(() => {
    const initialDocument = `using System;

Console.WriteLine("Hello, world!");`;
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
        oneDark,
        readUpdates,
        wasmSharpField(props.wasmSharpModule),
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
  console.log("Fetching completions");
  const completions = await compilation.getCompletions(from);

  return {
    from: from,
    options: completions.map(mapCompletionItemToCodeMirrorCompletion),
    validFor: /\w*$/,
  };
}

function mapCompletionItemToCodeMirrorCompletion(item: CompletionItem): Completion {
  return {
    label: item.displayText,
    detail: item.inlineDescription,
    type: mapAndGetBestMatchingTypeFromTag(item.tags),
  };
}

function mapAndGetBestMatchingTypeFromTag(tags: TextTag[]) {
  var mappedTags = tags.map(mapTextTagToType);
  if (mappedTags.length === 0) {
    if (process.env.NODE_ENV === "development") {
      console.debug("No tags found for completion.");
    }
    return "keyword";
  }
  const priority = mappedTags.find((x) => x !== "keyword");
  if (priority) {
    return priority;
  }

  return mappedTags[0];
}

/**
 * From code mirror:
 * The base library defines simple icons for class, constant, enum, function,
 * interface, keyword, method, namespace, property, text, type, and variable.
 */

function mapTextTagToType(tag: TextTag) {
  //TODO: Get rid of this and just support the tags directly via cm-* classes?
  switch (tag) {
    //constants
    case "Constant":
      return "constant";
    //enums
    case "Enum":
    case "EnumMember":
      return "enum";
    //variables
    case "Parameter":
    case "Local":
    case "RangeVariable":
      return "variable";
    //interfaces
    case "Interface":
      return "interface";
    //methods/functions
    case "Method":
    case "ExtensionMethod":
    case "Delegate":
      return "method";
    //properties
    case "Field":
    case "Property":
      return "property";
    //namespaces
    case "Namespace":
    case "Module":
    case "Assembly":
      return "namespace";
    //classes/types
    case "Class":
    case "Record":
    case "RecordStruct":
    case "Struct":
      return "class";
    //text
    case "Text":
    case "NumericLiteral":
    case "StringLiteral":
      return "text";
    //and return keyword for all the rest
    case "Keyword":
    case "Alias":
    case "ErrorType":
    case "Event":
    case "Label":
    case "LineBreak":
    case "Operator":
    case "Punctuation":
    case "Space":
    case "AnonymousTypeIndicator":
    case "TypeParameter":
    case "ContainerStart":
    case "ContainerEnd":
    case "CodeBlockStart":
    case "CodeBlockEnd":
      return "keyword";
    default:
      if (process.env.NODE_ENV === "development") {
        // console.warn(
        //   `Unmapped tag: ${tag}\n` +
        //     "Consider mapping this tag inside the `mapTextTagToType` function.\n" +
        //     'Falling back to "keyword".\n'
        // );
      }
      return "keyword";
  }
}

type LintConfig = NonNullable<Parameters<typeof linter>[1]>;
interface CSharpLinterConfig extends LintConfig {}

const wasmSharpField = (module: Promise<WasmSharpModule>) => {
  const ref = { value: null } as { value: WasmSharpModule | null };
  module.then((c) => (ref.value = c));
  const facet = wasmSharpFacet.of(() => {
    return ref.value;
  });
  return [csharpCompilationField.extension, facet];
};

const wasmSharpFacet = Facet.define<() => WasmSharpModule | null>({
  static: true,
});

const csharpCompilationField = StateField.define({
  create(state) {
    return {
      ready: false,
      compilation: null as Compilation | null,
    };
  },
  update(value, tr) {
    if (!value.ready) {
      const compilation = tr.state.facet(wasmSharpFacet)[0]();
      if (compilation) {
        value.ready = true;
        value.compilation = compilation.createCompilation(tr.newDoc.toString());
      }
    }

    if (tr.docChanged && value.ready) {
      value.compilation?.recompile(tr.newDoc.toString());
    }
    return value;
  },
});

const csharpLinterSource = "@WasmSharp";

function getCompilation(state: EditorState) {
  return state.field(csharpCompilationField).compilation;
}

export const csharpLinter = (config?: CSharpLinterConfig) => {
  return linter(async (view) => {
    const diagnostics: CmDiagnostic[] = [];
    const compilation = getCompilation(view.state);
    if (!compilation) {
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
