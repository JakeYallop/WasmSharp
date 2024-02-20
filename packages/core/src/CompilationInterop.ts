export type CompilationId = string;
export const enum CharacterOperation {
  None = 0,
  Inserted = 1,
  Deleted = 2,
}

//TODO: Make this private, maybe by not exporting it from the pacakge.json
export declare class CompilationInterop {
  InitAsync(publicUrl: string, monoConfig: string): Promise<void>;

  CreateNewCompilation(code: string): CompilationId;
  Recompile(compilationId: CompilationId, code: string): void;
  GetDiagnosticsAsync(compilationId: CompilationId): Promise<string>;
  GetCompletionsAsync(compilationId: CompilationId, caretPosition: number, filterText?: string): Promise<string>;
  ShouldTriggerCompletionsAsync(compilationId: CompilationId, caretPosition: number): Promise<boolean>;
  ShouldTriggerCompletionsAsync(
    compilationId: CompilationId,
    caretPosition: number,
    char: string,
    operation: CharacterOperation
  ): Promise<boolean>;
  ShouldTriggerCompletionsAsync(
    compilationId: CompilationId,
    caretPosition: number,
    char?: string,
    operation?: CharacterOperation
  ): Promise<boolean>;
  RunAsync(compilationId: string): Promise<string>;
}
