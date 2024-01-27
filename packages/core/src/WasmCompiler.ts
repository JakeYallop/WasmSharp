import type { MonoConfig } from "./dotnet.js";
import type { Span } from "./Roslyn/Text.js";
import type { TextTag } from "./Roslyn/TextTags.js";
import * as Comlink from "https://unpkg.com/comlink/dist/esm/comlink.mjs";
import { WasmSharpWorker } from "./WasmSharpWorker.js";
import { Compilation } from "./WasmCompiler.js";
import type { WasmSharpWebWorker } from "./worker.js";
import type { CompilationInterop } from "./CompilationInterop.js";

export interface WasmSharpModuleOptions {
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
}

export interface WasmSharpModuleCallbacks {
  onConfigLoaded?(config: MonoConfig): void;
  onDownloadResourceProgress?(loadedResources: number, totalResources: number): void;
}

export type WasmSharpOptions = {
  disableWebWorker?: boolean;
} & WasmSharpModuleOptions &
  WasmSharpModuleCallbacks;

export class WasmSharpModule {
  constructor(private worker: WasmSharpWorker | Comlink.Remote<WasmSharpWebWorker>) {}
  static async initializeAsync(options?: WasmSharpOptions) {
    //TODO: Rewrite this using dynamic import so that we do not load web worker code when its disabled, and vice versa.
    if (options?.disableWebWorker) {
      const module = await WasmSharpWorker.initializeAsync(options, {
        onConfigLoaded: options?.onConfigLoaded,
        onDownloadResourceProgress: options?.onDownloadResourceProgress,
      });
      return new WasmSharpModule(module);
    } else {
      const worker = new Worker(new URL("./worker.js", import.meta.url).href, { type: "module" });
      const WorkerClass = Comlink.wrap<typeof WasmSharpWebWorker>(worker);

      //functions are not structured cloneable
      if (options?.onConfigLoaded || options?.onDownloadResourceProgress) {
        const onConfigLoaded = options.onConfigLoaded;
        const onDownloadResourceProgress = options.onDownloadResourceProgress;
        worker.addEventListener("message", (e) => {
          if (e.data.type && e.data.type === "configLoaded" && e.data.config) {
            onConfigLoaded?.(e.data.config);
          }

          if (e.data.type && e.data.type === "downloadResourceProgress") {
            onDownloadResourceProgress?.(e.data.loadedResources, e.data.totalResources);
          }
        });

        delete options.onConfigLoaded;
        delete options.onDownloadResourceProgress;
      }

      const module = await new WorkerClass();
      await module.initializeAsync(options);
      return new WasmSharpModule(module);
    }
  }

  createCompilationAsync: (code: string) => Promise<Compilation> = async (code: string) =>
    await this.worker.createCompilationAsync(code);
}

export type CompletionItem = {
  displayText: string;
  sortText: string;
  inlineDescription: string;
  tags: TextTag[];
  span: Span;
};

export interface AssemblyExports {
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

export * from "./Roslyn/TextTags.js";
export * from "./Roslyn/Text.js";
export * from "./WasmSharpWorker.js";

export { Compilation } from "./Compilation.js";
