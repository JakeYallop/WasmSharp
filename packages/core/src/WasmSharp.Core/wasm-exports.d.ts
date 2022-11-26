export interface AssemblyExports {
  CompilationInterop: CompilationInterop;
}

export type CompilationId = string;

type TextSpan = {
  start: number;
  end: number;
  length: number;
  isEmpty: boolean;
};

interface Diagnostic {
  id: string;
  message: string;
  location: TextSpan;
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

export class CompilationInterop {
  InitAsync(publicUrl: string, monoConfig: string): Promise<void>;

  CreateNewCompilation(code: string): CompilationId;
  Recompile(compilationId: CompilationId, code: string): void;
  GetDiagnostics(compilationId: CompilationId): string;
  Run(compilationId: string): string;
}
