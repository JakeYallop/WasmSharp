import { initializeWasmSharpModule } from "./initializeWasmSharpModule.js";
import type { WasmSharpModuleCallbacks, WasmSharpModuleOptions } from "./WasmCompiler.js";
import { CompilationInterop } from "./CompilationInterop.js";
import { Compilation } from "./Compilation.js";

export class WasmSharpWorker {
  constructor(private interop: CompilationInterop) {}
  static async initializeAsync(options?: WasmSharpModuleOptions, callbacks?: WasmSharpModuleCallbacks) {
    const interop = await initializeWasmSharpModule(options, callbacks);
    return new WasmSharpWorker(interop);
  }
  createCompilationAsync(code: string) {
    return Promise.resolve(Compilation.create(code, this.interop));
  }
}
