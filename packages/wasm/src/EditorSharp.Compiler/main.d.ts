export interface AssemblyExports {
    Compiler: Compiler
}

export class Compiler {
    InitAsync(monoConfig: string): Promise<void>
}