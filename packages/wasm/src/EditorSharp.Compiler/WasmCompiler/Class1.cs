using System.Collections.Concurrent;
using System.Reflection;
using System.Reflection.Metadata;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.Text;

namespace EditorSharp.Compiler;

/// <summary>
/// Compiles C# code inside the browser.
/// </summary>
public static class WasmCompiler
{
    public static async Task InitializeAsync(MonoConfig config)
    {
        var resolver = new WasmMetadataReferenceResolver();
        foreach (var asset in config.Assets)
        {
            if (asset.Behaviour != AssetBehaviour.Assembly.Behaviour)
            {
                continue;
            }
            var reference = await resolver.ResolveReferenceAsync(config.AssemblyRootFolder, asset.Name);
            WasmCache.AddReference(reference);
        }
    }

    public static WasmCompilation CreateCompilation(string code, WasmCompilerOptions? options = null)
    {
        options ??= WasmCompilerOptions.Default;
        var tree = CSharpSyntaxTree.ParseText(code, options.CSharpParseOptions);
        var compilation = CSharpCompilation.Create("editorsharp.wasm", new[] { tree }, options: options.CSharpCompilationOptions);
        return new WasmCompilation(compilation, options);
    }
}

public class WasmCompilation
{
    private readonly WasmCompilerOptions _options;

    public WasmCompilation(CSharpCompilation compilation, WasmCompilerOptions? options = null)
    {
        Compilation = compilation;
        _options = options ?? WasmCompilerOptions.Default;
    }

    public CSharpCompilation Compilation { get; }
    public IEnumerable<Diagnostic> GetDiagnostics()
    {
        return Compilation.GetDiagnostics().Select(x => new Diagnostic(x.Id, x.GetMessage(), x.Location.SourceSpan, x.Severity));
    }
}

public class Diagnostic
{
    public Diagnostic(string id, string message, TextSpan location, DiagnosticSeverity severity)
    {
        Id = id;
        Message = message;
        Location = location;
        Severity = severity.ToString();
    }

    public string Id { get; set; }
    public string Message { get; set; }
    public TextSpan Location { get; set; }
    public string Severity { get; set; }
}



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

public static class WasmCache
{
    public static readonly Dictionary<string, Compilation> Compilations = new();
    public static IReadOnlyCollection<MetadataReference> MetadataReferences => _metadataReferences.AsReadOnly();
    public static readonly List<MetadataReference> _metadataReferences = new();

    public static void AddReference(MetadataReference reference)
    {
        _metadataReferences.Add(reference);
    }

}

public abstract class DynamicMetadataReferenceResolver
{
    public abstract Task<MetadataReference> ResolveReferenceAsync(Assembly assembly);
}

public class WasmMetadataReferenceResolver : DynamicMetadataReferenceResolver
{
    private static readonly HttpClient Client = new();
    public override Task<MetadataReference> ResolveReferenceAsync(Assembly assembly)
    {
        throw new NotImplementedException();
    }

    public Task<MetadataReference> ResolveReferenceAsync(string rootFolder, string assembly)
    {
        var url = rootFolder + "/" + assembly;
        return Task.FromResult<MetadataReference>(null!);
    }
}
