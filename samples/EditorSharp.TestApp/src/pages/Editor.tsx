import { TestExport } from "@editorsharp/core";
import { config, Compiler } from "@editorsharp/compiler";

const Editor = () => {
  const code = 'using System; Console.WriteLine("Test");';
  const a = config;
  // const assemblyName = Compiler.Compile(code);
  // const diagnostics = Compiler.GetDiagnostics(code);
  return (
    <div>
      {/* <h2>Export from @editorsharp/core: {TestExport}</h2>
			<h2>AssemblyName from @editorsharp/compiler: {assemblyName}</h2>
			<h2>Ref List:</h2> */}
      {/* <PrettyPrint object={JSON.parse(Compiler.GetRefList(code))} /> */}
      <h1>Diagnostics:</h1>
      {/* @ts-ignore */}
      {/* <PrettyPrint object={JSON.parse(diagnostics)} /> */}
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
