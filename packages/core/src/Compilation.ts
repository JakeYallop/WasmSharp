import type { Diagnostic, CompletionItem, RunResult } from "./WasmCompiler.js";
import type { CharacterOperation, CompilationId, CompilationInterop } from "./CompilationInterop.js";

function get<T>(json: any): T {
  return JSON.parse(json) as T;
}

export class Compilation {
  private constructor(private compilationId: CompilationId, private wasmHost: CompilationInterop) {}

  static create(code: string, interop: CompilationInterop): Compilation {
    const compilationId = interop!.CreateNewCompilation(code);
    return new Compilation(compilationId, interop);
  }

  recompileAsync(code: string) {
    return Promise.resolve(this.wasmHost.Recompile(this.compilationId, code));
  }

  async getDiagnosticsAsync() {
    const diagnostics = await this.wasmHost.GetDiagnosticsAsync(this.compilationId);
    return get<Diagnostic[]>(diagnostics);
  }

  async getCompletions(caretPosition: number, filterText?: string) {
    const completions = await this.wasmHost.GetCompletionsAsync(this.compilationId, caretPosition, filterText);
    return get<CompletionItem[]>(completions);
  }

  shouldTriggerCompletionsAsync(caretPosition: number): Promise<boolean>;
  shouldTriggerCompletionsAsync(
    caretPosition: number,
    character: string,
    operation: CharacterOperation
  ): Promise<boolean>;
  async shouldTriggerCompletionsAsync(
    caretPosition: number,
    character?: string,
    operation?: CharacterOperation
  ): Promise<boolean> {
    if (character || operation) {
      if (character && operation) {
        return this.wasmHost.ShouldTriggerCompletionsAsync(this.compilationId, caretPosition, character, operation);
      }
      throw new TypeError("Expected both character and operation to be provided or for neither to be provided.");
    }
    return this.wasmHost.ShouldTriggerCompletionsAsync(this.compilationId, caretPosition);
  }

  async run() {
    const runResult = await this.wasmHost.RunAsync(this.compilationId);
    return get<RunResult>(runResult);
  }
}
