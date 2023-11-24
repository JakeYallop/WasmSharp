import { CompilationId } from "./WasmCompiler.js";

//TODO: Make this private

export declare class CompilationInterop {
  InitAsync(publicUrl: string, monoConfig: string): Promise<void>;

  CreateNewCompilation(code: string): CompilationId;
  Recompile(compilationId: CompilationId, code: string): void;
  GetDiagnosticsAsync(compilationId: CompilationId): Promise<string>;
  GetCompletionsAsync(compilationId: CompilationId, caretPosition: number, filterText?: string): Promise<string>;
  RunAsync(compilationId: string): Promise<string>;
}
