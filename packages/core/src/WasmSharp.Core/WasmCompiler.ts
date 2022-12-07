import { dotnet } from "./dotnet.js";
import { Span } from "./Roslyn/Text";
import { TextTag } from "./Roslyn/TextTags";
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
    // https://github.com/dotnet/runtime/blob/13a9a3ce67b3ab88cd6c0a975a47ed856e005d42/src/mono/wasm/runtime/driver.c#L560
    /*
     * debug_level > 0 enables debugging and sets the debug log level to debug_level
     * debug_level == 0 disables debugging and enables interpreter optimizations
     * debug_level < 0 enabled debugging and disables debug logging.
     *
     * Note: when debugging is enabled interpreter optimizations are disabled.
     */
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

  async getDiagnosticsAsync() {
    const diagnostics = await this.interop?.GetDiagnosticsAsync(
      this.compilationId
    );
    return get<Diagnostic[]>(diagnostics);
  }

  async getCompletions(caretPosition: number, filterText?: string) {
    var completions = await this.interop.GetCompletionsAsync(
      this.compilationId,
      caretPosition,
      filterText
    );
    return get<CompletionItem[]>(completions);
  }

  run() {
    return get<RunResult>(this.interop!.Run(this.compilationId));
  }
}

export type CompletionItem = {
  displayText: string;
  sortText: string;
  inlineDescription: string;
  tags: TextTag[];
  span: Span;
};

export interface AssemblyExports {
  CompilationInterop: CompilationInterop;
}

export type CompilationId = string;

export type DiagnosticSeverity = "Error" | "Warning" | "Info" | "Hidden";

//TODO: Map DescriptionProperty??
/*
properties: {DescriptionProperty: 'Text|bool Keyword'}
extract "bool Keyword" from this to match how this is displayed in VS
*/
//Requires serializing properties

export interface Diagnostic {
  id: string;
  message: string;
  location: Span;
  severity: DiagnosticSeverity;
}

interface RunResultSuccess {
  stdOut: string;
  stdErr: string;
  success: true;
}

interface RunResultFailure {
  stdOut: null;
  stdErr: null;
  success: false;
}

export type RunResult = RunResultSuccess | RunResultFailure;

export declare class CompilationInterop {
  InitAsync(publicUrl: string, monoConfig: string): Promise<void>;

  CreateNewCompilation(code: string): CompilationId;
  Recompile(compilationId: CompilationId, code: string): void;
  GetDiagnosticsAsync(compilationId: CompilationId): Promise<string>;
  GetCompletionsAsync(
    compilationId: CompilationId,
    caretPosition: number,
    filterText?: string
  ): Promise<string>;
  Run(compilationId: string): string;
}
