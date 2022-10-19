using System.Reflection;
using System.Reflection.Metadata;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.Text;

namespace EditorSharp.Compiler;

/// <summary>
/// Compiles C# code inside the browser.
/// </summary>
public class WasmCompiler
{
    private WasmCompiler() { }
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


    public async Task ResolveReferencesAsync()
    {
        foreach (var assembly in AppDomain.CurrentDomain.GetAssemblies())
        {
            var reference = await _options.MetadataReferenceResolver.ResolveReferenceAsync(assembly);
            Compilation.AddReferences(reference);
        }
    }

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
    private static readonly DynamicMetadataReferenceResolver DefaultResolver = new DefaultMetadataReferenceResolver();
    public static WasmCompilerOptions Default => new(DefaultResolver);
    public static CSharpParseOptions DefaultParseOptions => CSharpParseOptions.Default;
    public static CSharpCompilationOptions DefaultCompilationOptions => new CSharpCompilationOptions(OutputKind.ConsoleApplication).WithConcurrentBuild(false);

    public WasmCompilerOptions(DynamicMetadataReferenceResolver? metadataReferenceResolver = null)
    {
        MetadataReferenceResolver = metadataReferenceResolver ?? new DefaultMetadataReferenceResolver();
        CSharpCompilationOptions = DefaultCompilationOptions;
        CSharpParseOptions = DefaultParseOptions;
    }

    public DynamicMetadataReferenceResolver MetadataReferenceResolver { get; }
    public CSharpCompilationOptions? CSharpCompilationOptions { get; }
    public CSharpParseOptions? CSharpParseOptions { get; }
}

public class CompilationCache
{
    private static readonly Dictionary<string, Compilation> Cache = new();
}

public abstract class DynamicMetadataReferenceResolver
{
    public abstract Task<MetadataReference> ResolveReferenceAsync(Assembly assembly);
}

public class DefaultMetadataReferenceResolver : DynamicMetadataReferenceResolver
{
    public override unsafe Task<MetadataReference> ResolveReferenceAsync(Assembly assembly)
    {
        assembly.TryGetRawMetadata(out var blob, out var length);
        var moduleMetadata = ModuleMetadata.CreateFromMetadata((IntPtr)blob, length);
        var assemblyMetadata = AssemblyMetadata.Create(moduleMetadata);
        return Task.FromResult<MetadataReference>(assemblyMetadata.GetReference());
    }
}

public class WasmMetadataReferenceResolver : DynamicMetadataReferenceResolver
{
    public override Task<MetadataReference> ResolveReferenceAsync(Assembly assembly)
    {
        throw new NotImplementedException();
    }
}
