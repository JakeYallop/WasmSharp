using System.Collections.Concurrent;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using WasmSharp.Core.Platform;
using CompletionItem = WasmSharp.Core.CompilationServices.CompletionItem;
using Diagnostic = WasmSharp.Core.CompilationServices.Diagnostic;

namespace WasmSharp.Core.CompilationServices;

/// <summary> 
/// Compiles C# code inside the browser.
/// </summary>
internal static class WasmSolution
{
    private static readonly Dictionary<string, CodeSession> CompilationCache = new();

    internal static async Task InitializeAsync(string publicUrl, BootJsonData config)
    {
        var resolver = new WasmMetadataReferenceResolver(publicUrl);
        var referenceTasks = new ConcurrentBag<Task<MetadataReference>>();

        foreach (var asset in config.Resources.Assembly)
        {
            //TODO: Handle WasmRuntimeAssetsLocation correctly here
            referenceTasks.Add(resolver.ResolveReferenceAsync("./", asset.Key));
        }
        var references = await Task.WhenAll(referenceTasks).ConfigureAwait(false);
        foreach (var reference in references)
        {
            MetadataReferenceCache.AddReference(reference);
        }
    }

    public static string CreateCompilation(string code, DocumentOptions? options = null)
    {
        options ??= DocumentOptions.Default;
        var tree = CSharpSyntaxTree.ParseText(code, options.CSharpParseOptions);
        var compilation = CSharpCompilation.Create("wasmsharpexecutor", new[] { tree }, MetadataReferenceCache.MetadataReferences, options: options.CSharpCompilationOptions);
        var wasmCompilation = new CodeSession(compilation, options);
        var compilationId = Guid.NewGuid().ToString();
        CompilationCache.Add(compilationId, wasmCompilation);
        return compilationId;
    }

    public static void Recompile(string compilationId, string code) => GetCompilation(compilationId).Recompile(code);
    public static Task<IEnumerable<Diagnostic>> GetDiagnosticsAsync(string compilationId) => GetCompilation(compilationId).GetDiagnosticsAsync();
    public static Task<IEnumerable<CompletionItem>> GetCompletionsAsync(string compilationId, int caretPosition) => GetCompilation(compilationId).GetCompletionsAsync(caretPosition);
    public static Task<RunResult> RunAsync(string compilationId) => GetCompilation(compilationId).RunAsync();

    private static CodeSession GetCompilation(string compilationId)
    {
        //Console.WriteLine($"Getting compilation {compilationId}.");
        if (!CompilationCache.TryGetValue(compilationId, out var compilation))
        {
            //TODO: Better custom exception/message/return bool and don't throw at all?
            throw new InvalidOperationException("compilation ID not recognised");
        }
        return compilation;
    }
}
