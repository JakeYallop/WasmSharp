using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;

namespace EditorSharp.Compiler;

public class WasmCompilerOptions
{
    public static WasmCompilerOptions Default => new();
    public static CSharpParseOptions DefaultParseOptions => CSharpParseOptions.Default;
    public static CSharpCompilationOptions DefaultCompilationOptions => new CSharpCompilationOptions(OutputKind.ConsoleApplication).WithConcurrentBuild(false);

    public WasmCompilerOptions()
    {
        CSharpCompilationOptions = DefaultCompilationOptions;
        CSharpParseOptions = DefaultParseOptions;
    }

    public CSharpCompilationOptions? CSharpCompilationOptions { get; }
    public CSharpParseOptions? CSharpParseOptions { get; }
}
