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

function getDirectory(path: string) {
  var index = path.lastIndexOf("/");
  if (index !== -1) {
    return path.substring(0, index);
  } else {
    return path;
  }
}

//TODO: finish this
export class CompilationFactory {
  constructor(private interop: CompilationInterop) {}
  static async createAsync(assembliesUrl?: string) {
    const { getAssemblyExports, getConfig } = await dotnet
      .withDiagnosticTracing(false)
      .withDebugging(-1)
      .create();

    const config = getConfig();
    const assemblyExports: AssemblyExports = await getAssemblyExports(
      config.mainAssemblyName!
    );
    const resolvedAssembliesUrl =
      assembliesUrl ?? getDirectory(import.meta.url);
    console.log(
      `Initialising compilation factory from url: ${resolvedAssembliesUrl}`
    );
    const time = performance.now();
    await assemblyExports.CompilationInterop.InitAsync(
      resolvedAssembliesUrl,
      JSON.stringify(config)
    );
    const diff = performance.now() - time;
    console.log(`%cFinished initialising compilation factory in ${diff}ms`);
    Compiler.interop = assemblyExports.CompilationInterop;
  }
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
    console.log(`loading files from ${getDirectory(import.meta.url)}`);
    await assemblyExports.CompilationInterop.InitAsync(
      assembliesUrl ?? getDirectory(import.meta.url),
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
