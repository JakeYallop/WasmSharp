using System.Collections.Concurrent;
using System.Collections.Immutable;
using System.Reflection;
using System.Reflection.Metadata;
using System.Security.Principal;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;

namespace WasmSharp.Core;

/// <summary>
/// Compiles C# code inside the browser.
/// </summary>
public static class WasmCompiler
{
    private static readonly Dictionary<string, WasmCompilation> CompilationCache = new();

    public static async Task InitializeAsync(string publicUrl, MonoConfig config)
    {
        var resolver = new WasmMetadataReferenceResolver(publicUrl);
        var referenceTasks = new ConcurrentBag<Task<MetadataReference>>();

        foreach (var asset in config.Assets)
        {
            if (asset.Behavior != AssetBehaviour.Assembly.Value || !asset.Name.EndsWith(".dll"))
            {
                continue;
            }
            referenceTasks.Add(resolver.ResolveReferenceAsync(config.AssemblyRootFolder, asset.Name));
        }
        var references = await Task.WhenAll(referenceTasks);
        foreach (var reference in references)
        {
            MetadataReferenceCache.AddReference(reference);
        }
    }

    public static string CreateCompilation(string code, WasmCompilerOptions? options = null)
    {
        options ??= WasmCompilerOptions.Default;
        var tree = CSharpSyntaxTree.ParseText(code, options.CSharpParseOptions);
        var compilation = CSharpCompilation.Create("wasmsharpexecutor", new[] { tree }, MetadataReferenceCache.MetadataReferences, options: options.CSharpCompilationOptions);
        var wasmCompilation = new WasmCompilation(compilation, options);
        var compilationId = Guid.NewGuid().ToString();
        CompilationCache.Add(compilationId, wasmCompilation);
        return compilationId;
    }

    public static void Recompile(string compilationId, string code) => GetCompilation(compilationId).Recompile(code);
    public static void Recompile(string compilationId, string[] codeFiles) => GetCompilation(compilationId).Recompile(codeFiles);
    public static IEnumerable<Diagnostic> GetDiagnostics(string compilationId) => GetCompilation(compilationId).GetDiagnostics();
    public static RunResult Run(string compilationId) => GetCompilation(compilationId).Run();

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

public class RunResult
{
    private RunResult() { }

    public static RunResult WithStdOutErr(string stdOut, string stdErr) => new()
    {
        Success = true,
        StdOut = stdOut,
        StdErr = stdErr
    };

    public static RunResult Failure => new() { Success = false };
    public bool Success { get; init; }
    public string? StdOut { get; init; }
    public string? StdErr { get; init; }
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

    public RunResult Run()
    {
        var ms = new MemoryStream();
        var result = Compilation.Emit(ms);
        if (result.Success)
        {
            var assembly = Assembly.Load(ms.ToArray());
            Console.WriteLine($"assembly: {assembly.FullName}");
            Console.WriteLine($"assembly defined types: {assembly.DefinedTypes.ToArray()}");
            Console.WriteLine($"assembly entry point: {assembly.EntryPoint}");
            var captureOutput = new StringWriter();
            var oldOut = Console.Out;
            Console.SetOut(captureOutput);
            var args = new[] { Array.Empty<string>() };
            //var instance = assembly.CreateInstance($"{Compilation.AssemblyName}.Program");
            //instance.GetType();
            //var mainMethod = instance.GetType().GetMethod("$Main");
            //Delegate d = Delegate.CreateDelegate(instance.GetType(), mainMethod);
            //d.DynamicInvoke();
            assembly.EntryPoint.Invoke(null, args);
            var capturedOutput = captureOutput.ToString();
            Console.SetOut(oldOut);

            Console.WriteLine("Captured output: ");
            Console.WriteLine(capturedOutput);

            return RunResult.WithStdOutErr(capturedOutput, "");
        }

        return RunResult.Failure;
    }

}
