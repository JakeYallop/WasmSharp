export interface AssemblyExports {
    Compiler: Compiler;
}

type CompilationId = string

type TextSpan = {
    //TODO: write this
    start: number
}

interface Diagnostic {
    id: string,
    message: string,
    location: TextSpan
}

export class Compiler {
    InitAsync(
        publicUrl: string,
        monoConfig: string
    ): Promise<void>;

    CreateNewCompilation(code: string): CompilationId;
    Recompile(compilationId: CompilationId, code: string): void
    GetDiagnostics(compilationId: CompilationId): string
}
