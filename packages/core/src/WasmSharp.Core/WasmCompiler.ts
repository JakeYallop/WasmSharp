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

export class AssemblyContext {
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
      `Initialising assembly context from url: ${resolvedAssembliesUrl}`
    );
    const time = performance.now();
    await assemblyExports.CompilationInterop.InitAsync(
      resolvedAssembliesUrl,
      JSON.stringify(config)
    );
    const diff = performance.now() - time;
    console.log(`Finished initialising assembly context in ${diff}ms`);
    return new AssemblyContext(assemblyExports.CompilationInterop);
  }

  createCompilation = (code: string) => Compilation.create(code, this.interop);
}

export class Compilation {
  private constructor(
    private compilationId: CompilationId,
    private interop: CompilationInterop
  ) {}

  static create(code: string, interop: CompilationInterop): Compilation {
    var compilationId = interop!.CreateNewCompilation(code);
    return new Compilation(compilationId, interop);
  }

  recompile(code: string) {
    return this.interop!.Recompile(this.compilationId, code);
  }

  getDiagnostics() {
    return get<Diagnostic[]>(this.interop?.GetDiagnostics(this.compilationId));
  }

  run() {
    return get<RunResult>(this.interop!.Run(this.compilationId));
  }
}
