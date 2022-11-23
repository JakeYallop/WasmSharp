using System.Collections.Concurrent;
using System.Collections.Immutable;
using System.Reflection.Metadata;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;

namespace EditorSharp.Compiler;

/// <summary>
/// Compiles C# code inside the browser.
/// </summary>
public static class WasmCompiler
{
    private static readonly Dictionary<string, WasmCompilation> CompilationCache = new();

    public static async Task InitializeAsync(string publicUrl, MonoConfig config)
    {
        var resolver = new WasmMetadataReferenceResolver(publicUrl);
        foreach (var asset in config.Assets)
        {
            if (asset.Behavior != AssetBehaviour.Assembly.Value)
            {
                continue;
            }
            var reference = await resolver.ResolveReferenceAsync(config.AssemblyRootFolder, asset.Name);
            MetadataReferenceCache.AddReference(reference);
        }
    }

    public static string CreateCompilation(string code, WasmCompilerOptions? options = null)
    {
        options ??= WasmCompilerOptions.Default;
        var tree = CSharpSyntaxTree.ParseText(code, options.CSharpParseOptions);
        var compilation = CSharpCompilation.Create("editorsharp.wasm", new[] { tree }, MetadataReferenceCache.MetadataReferences, options: options.CSharpCompilationOptions);
        var wasmCompilation = new WasmCompilation(compilation, options);
        var compilationId = Guid.NewGuid().ToString();
        CompilationCache.Add(compilationId, wasmCompilation);
        return compilationId;
    }

    public static void Recompile(string compilationId, string code) => GetCompilation(compilationId).Recompile(code);
    public static void Recompile(string compilationId, string[] codeFiles) => GetCompilation(compilationId).Recompile(codeFiles);
    public static IEnumerable<Diagnostic> GetDiagnostics(string compilationId) => GetCompilation(compilationId).GetDiagnostics();

    private static WasmCompilation GetCompilation(string compilationId)
    {
        if (!CompilationCache.TryGetValue(compilationId, out var compilation))
        {
            //TODO: Better custom exception/message/return bool and don't throw at all?
            throw new InvalidOperationException("compilation ID not recognised");
        }
        return compilation;
    }
}

public static class WasmCompilationCache
{

}


public class WasmCompilation
{
    private readonly WasmCompilerOptions _options;

    public WasmCompilation(CSharpCompilation compilation, WasmCompilerOptions? options = null)
    {
        Compilation = compilation;
        _options = options ?? WasmCompilerOptions.Default;
    }

    public CSharpCompilation Compilation { get; private set; }

    public void AddSyntaxTree(string code)
    {
        var tree = CSharpSyntaxTree.ParseText(code, _options.CSharpParseOptions);
        Compilation = Compilation.AddSyntaxTrees(tree);
    }

    public void Recompile(string code)
    {
        var tree = CSharpSyntaxTree.ParseText(code, _options.CSharpParseOptions);
        Compilation = Compilation.RemoveAllSyntaxTrees();
        Compilation = Compilation.AddSyntaxTrees(tree);
    }

    public void Recompile(string[] codeFiles)
    {
        Compilation = Compilation.RemoveAllSyntaxTrees();
        var trees = new List<SyntaxTree>();
        foreach (var code in codeFiles)
        {
            trees.Add(CSharpSyntaxTree.ParseText(code, _options.CSharpParseOptions));
        }
        Compilation = Compilation.AddSyntaxTrees(trees);
    }

    //TODO: Investigate event based approach when trees are refreshed?? Maybe can be done from JS side. If so, we should see if
    //it can be done lazily - e.g do not materialize diagnostics if no listeners are registered.
    public IEnumerable<Diagnostic> GetDiagnostics()
    {
        return Compilation.GetDiagnostics().Select(x => new Diagnostic(x.Id, x.GetMessage(), x.Location.SourceSpan, x.Severity));
    }
}
