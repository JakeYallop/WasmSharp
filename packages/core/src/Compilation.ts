import type { CompilationId, Diagnostic, CompletionItem, RunResult } from "./WasmCompiler.js";
import type { CompilationInterop } from "./CompilationInterop.js";

function get<T>(json: any): T {
  return JSON.parse(json) as T;
}

export class Compilation {
  private constructor(private compilationId: CompilationId, private interop: CompilationInterop) {}

  static create(code: string, interop: CompilationInterop): Compilation {
    const compilationId = interop!.CreateNewCompilation(code);
    return new Compilation(compilationId, interop);
  }

  recompileAsync(code: string) {
    return Promise.resolve(this.interop!.Recompile(this.compilationId, code));
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
