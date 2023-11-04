import createDotnetRuntime, {
  dotnet as dotnetHostBuilder,
  MonoConfig,
  DotnetModuleConfig,
  DotnetHostBuilder,
} from "./dotnet.js";
import { Span } from "./Roslyn/Text";
import { TextTag } from "./Roslyn/TextTags";
function get<T>(json: any): T {
  return JSON.parse(json) as T;
}

function getDirectory(path: string) {
  var index = path.lastIndexOf("/");
  if (index !== -1) {
    return path.substring(0, index + 1);
  } else {
    return path;
  }
}

export interface WasmSharpOptions {
  /**
   * URL to resolve assemblies from.
   */
  assembliesUrl?: string;
  enableDiagnosticTracing?: boolean;
  /*
   * https://github.com/dotnet/runtime/blob/a270140281a13ab82a4401dff3da6d27fe499087/src/mono/wasi/runtime/driver.c#L470
   * debug_level > 0 enables debugging and sets the debug log level to debug_level
   * debug_level == 0 disables debugging and enables interpreter optimizations
   * debug_level < 0 enabled debugging and disables debug logging.
   *
   * Note: when debugging is enabled interpreter optimizations are disabled.
   */
  debugLevel?: number;
  onConfigLoaded?(config: MonoConfig): void;
  onDownloadResourceProgress?(loadedResources: number, totalResources: number): void;
}

export class WasmSharpModule {
  constructor(private interop: CompilationInterop) {}
  static async initializeAsync(options?: WasmSharpOptions) {
    type InternalsHostBuilder = DotnetHostBuilder & {
      //internal method: https://github.com/dotnet/runtime/blob/a270140281a13ab82a4401dff3da6d27fe499087/src/mono/wasm/runtime/loader/run.ts#L26
      withModuleConfig(config: DotnetModuleConfig): InternalsHostBuilder;
    };
    const hostBuilder: InternalsHostBuilder = dotnetHostBuilder as InternalsHostBuilder;

    let resourcesToLoad = 0;
    const { getAssemblyExports, getConfig } = await hostBuilder
      .withModuleConfig({
        onConfigLoaded(config: MonoConfig) {
          resourcesToLoad = Object.keys(config.resources?.assembly ?? {}).length;
          resourcesToLoad += Object.keys(config.resources?.pdb ?? {}).length;
          resourcesToLoad += Object.keys(config.resources?.icu ?? {}).length;
          //we are off by one when using the above - maybe its the wasm module, maybe its something else. Either way, this resolves the issue for now
          resourcesToLoad += 1;
          options?.onConfigLoaded?.(config);
        },
        onDownloadResourceProgress(loaded: number, total: number) {
          options?.onDownloadResourceProgress?.(loaded, resourcesToLoad);
        },
      })
      .withDiagnosticTracing(options?.enableDiagnosticTracing ?? false)
      .withDebugging(options?.debugLevel ?? 1)
      .create();

    const config = getConfig();
    const assemblyExports: AssemblyExports = await getAssemblyExports(config.mainAssemblyName!);
    const compilationInterop = assemblyExports.WasmSharp.Core.CompilationInterop;
    //TODO: Handle nested assets folder (WasmRuntimeAssetsLocation)
    const resolvedAssembliesUrl = options?.assembliesUrl ?? getDirectory(import.meta.url);
    console.log(`Initialising assembly context from url: ${resolvedAssembliesUrl}`);
    const time = performance.now();
    await compilationInterop.InitAsync(resolvedAssembliesUrl, JSON.stringify(config));
    const diff = performance.now() - time;
    console.log(`Finished initialising assembly context in ${diff}ms`);
    return new WasmSharpModule(compilationInterop);
  }

  createCompilation = (code: string) => Compilation.create(code, this.interop);
}

export class Compilation {
  private constructor(private compilationId: CompilationId, private interop: CompilationInterop) {}

  static create(code: string, interop: CompilationInterop): Compilation {
    const compilationId = interop!.CreateNewCompilation(code);
    return new Compilation(compilationId, interop);
  }

  recompile(code: string) {
    return this.interop!.Recompile(this.compilationId, code);
  }

  async getDiagnosticsAsync() {
    const diagnostics = await this.interop?.GetDiagnosticsAsync(this.compilationId);
    return get<Diagnostic[]>(diagnostics);
  }

  async getCompletions(caretPosition: number, filterText?: string) {
    const completions = await this.interop.GetCompletionsAsync(this.compilationId, caretPosition, filterText);
    return get<CompletionItem[]>(completions);
  }

  async run() {
    console.debug("Executing code");
    const runResult = await this.interop!.RunAsync(this.compilationId);
    return get<RunResult>(runResult);
  }
}

export type CompletionItem = {
  displayText: string;
  sortText: string;
  inlineDescription: string;
  tags: TextTag[];
  span: Span;
};

interface AssemblyExports {
  WasmSharp: {
    Core: {
      CompilationInterop: CompilationInterop;
    };
  };
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
  diagnostics: [];
}

interface RunResultFailure {
  stdOut: null;
  stdErr: null;
  success: false;
  diagnostics: Diagnostic[];
}

export type RunResult = RunResultSuccess | RunResultFailure;

//TODO: Make this private once assembly context is renamed and we have a public API that wraps this
export declare class CompilationInterop {
  InitAsync(publicUrl: string, monoConfig: string): Promise<void>;

  CreateNewCompilation(code: string): CompilationId;
  Recompile(compilationId: CompilationId, code: string): void;
  GetDiagnosticsAsync(compilationId: CompilationId): Promise<string>;
  GetCompletionsAsync(compilationId: CompilationId, caretPosition: number, filterText?: string): Promise<string>;
  RunAsync(compilationId: string): Promise<string>;
}
