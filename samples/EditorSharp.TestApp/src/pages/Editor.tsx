import { TestExport } from "@editorsharp/core";
import { Compiler } from "@editorsharp/compiler";
import {
  children,
  Component,
  createResource,
  createSignal,
  ParentComponent,
  ParentProps,
} from "solid-js";

const Editor = () => {
  const [compilerInit] = createResource(() => Compiler.initAsync());
  return (
    <>
      {compilerInit.loading && <h2>Loading, please wait...</h2>}
      {compilerInit.state === "errored" && (
        <h2>Failed to load, please check the console</h2>
      )}
      {compilerInit.state === "ready" && <InitializedEditor />}
    </>
  );
};

const InitializedEditor: Component = (props) => {
  const [output, setOutput] = createSignal<string>();

  const code =
    'using System; Console.WriteLine("Compiled and run from within web browser using WASM!");';
  // const assemblyName = Compiler.Compile(code);
  // const diagnostics = Compiler.GetDiagnostics(code);

  const compilation = Compiler.createCompilation(code);
  const diagnostics = compilation.getDiagnostics();

  return (
    <div>
      {/* <h2>Export from @editorsharp/core: {TestExport}</h2>
			<h2>AssemblyName from @editorsharp/compiler: {assemblyName}</h2>
        <h2>Ref List:</h2> */}
      {/* <PrettyPrint object={JSON.parse(Compiler.GetRefList(code))} /> */}
      <h1>Diagnostics:</h1>
      <PrettyPrint object={diagnostics} />
      <button
        onClick={() => {
          const result = compilation.run();
          if (result.success) {
            setOutput(result.stdOut);
          }
        }}
      >
        <h1>Run</h1>
      </button>
      {!!output() && (
        <>
          <h1>Output</h1>
          <pre>{output()}</pre>
        </>
      )}
    </div>
  );
};

interface Props<T> {
  object: T;
}
const PrettyPrint = <T,>(props: Props<T>) => {
  return <pre>{JSON.stringify(props.object, null, "\t")}</pre>;
};

export default Editor;
