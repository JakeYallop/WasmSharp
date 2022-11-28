import { Component, createSignal, onCleanup, onMount } from "solid-js";
import { basicSetup, EditorView } from "codemirror";
import { dracula } from "thememirror";
import { StreamLanguage } from "@codemirror/language";
import { csharp } from "@codemirror/legacy-modes/mode/clike";
import "./CodeMirrorEditor.css";

const CodeMirrorEditor: Component<{
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

export default CodeMirrorEditor;
