import { dotnet } from "./dotnet.js";
import { RunResult } from "./wasm-exports";
import {
  AssemblyExports,
  CompilationId,
  CompilationInterop,
  Diagnostic,
} from "./wasm-exports";

function get<T>(json: any): T {
  return JSON.parse(json) as T;
}

export class Compiler {
  private constructor(private compilationId: CompilationId) {}

  static interop: CompilationInterop | undefined;
  static async initAsync(assembliesUrl?: string) {
    const { getAssemblyExports, getConfig } = await dotnet
      .withDiagnosticTracing(false)
      .withDebugging(-1)
      .create();

    const config = getConfig();
    const assemblyExports: AssemblyExports = await getAssemblyExports(
      config.mainAssemblyName!
    );
    const style = `
        font-size:1.1rem;
        font-family:sans-serif;
        background-color:0x333;
        `;
    console.log("%cInitialising wasm compiler", style);
    const time = performance.now();
    console.log(`loading files from ${import.meta.url}`);
    await assemblyExports.CompilationInterop.InitAsync(
      assembliesUrl ?? import.meta.url,
      JSON.stringify(config)
    );
    const diff = performance.now() - time;
    console.log(`%cFinished initialising wasm compiler in ${diff}ms`, style);
    Compiler.interop = assemblyExports.CompilationInterop;
  }

  static createCompilation(code: string): Compiler {
    Compiler.ensureLoaded();
    var compilationId = this.interop!.CreateNewCompilation(code);
    return new Compiler(compilationId);
  }

  recompile(code: string) {
    Compiler.ensureLoaded();
    return Compiler.interop!.Recompile(this.compilationId, code);
  }

  getDiagnostics() {
    Compiler.ensureLoaded();
    return get<Diagnostic[]>(
      Compiler.interop?.GetDiagnostics(this.compilationId)
    );
  }

  run() {
    Compiler.ensureLoaded();
    return get<RunResult>(Compiler.interop!.Run(this.compilationId));
  }

  private static ensureLoaded(): void /* asserts instance is CompilationInterop */ {
    if (!Compiler.interop) {
      throw new Error(
        "Cannot create or interact with a compilation, as the Compiler has not been initialized.\n" +
          "Please call Compiler.InitAsync(string) to initialize the wasm bundle."
      );
    }
  }
}
