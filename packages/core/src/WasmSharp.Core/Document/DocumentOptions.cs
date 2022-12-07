using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;

namespace WasmSharp.Core.Document;

public class DocumentOptions
{
    public static DocumentOptions Default => new();
    public static CSharpParseOptions DefaultParseOptions => CSharpParseOptions.Default;
    public static CSharpCompilationOptions DefaultCompilationOptions => new CSharpCompilationOptions(OutputKind.ConsoleApplication).WithConcurrentBuild(false);

    public DocumentOptions()
    {
        CSharpCompilationOptions = DefaultCompilationOptions;
        CSharpParseOptions = DefaultParseOptions;
    }

    public CSharpCompilationOptions? CSharpCompilationOptions { get; }
    public CSharpParseOptions? CSharpParseOptions { get; }
}
