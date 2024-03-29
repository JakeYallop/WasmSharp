//There does not appear to be a good way to reference web worker and DOM types in the same project for different files.
//For now, just comment in the above if web worker types are desired (and ignore any DOM types)
// /// <reference lib="webworker" />

import * as Comlink from "https://unpkg.com/comlink/dist/esm/comlink.mjs";
import { Compilation } from "./Compilation";
import type { MonoConfig } from "./dotnet";
import { initializeWasmSharpModule } from "./initializeWasmSharpModule";
import type { CompilationInterop } from "./CompilationInterop";

export class WasmSharpWebWorker {
  private interop!: CompilationInterop;
  constructor() {
    return this;
  }
  async initializeAsync(options?: any) {
    const onConfigLoaded = (config: MonoConfig) => postMessage({ type: "configLoaded", config });
    const onDownloadResourceProgress = (loaded: number, total: number) =>
      postMessage({ type: "downloadResourceProgress", loadedResources: loaded, totalResources: total });
    this.interop = await initializeWasmSharpModule(options, { onConfigLoaded, onDownloadResourceProgress });
  }
  createCompilationAsync(code: string): Compilation {
    this.#ensureInitialized();
    return Comlink.proxy(Compilation.create(code, this.interop));
  }

  #ensureInitialized() {}
}

Comlink.expose(WasmSharpWebWorker);
