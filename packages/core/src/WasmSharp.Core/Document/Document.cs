using System.Collections.Concurrent;
using System.Collections.Immutable;
using System.Reflection;
using System.Reflection.Metadata;
using System.Security.Principal;
using System.Xml.Linq;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.Completion;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.Elfie.Diagnostics;
using Microsoft.CodeAnalysis.Text;
using WasmSharp.Core.Document;
using CompletionItem = WasmSharp.Core.Document.CompletionItem;
using Diagnostic = WasmSharp.Core.Document.Diagnostic;

namespace WasmSharp.Core.CodeSession;

/// <summary>
/// Compiles C# code inside the browser.
/// </summary>
public static class WasmSolution
{
    private static readonly Dictionary<string, CodeSession> CompilationCache = new();

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
    public static RunResult Run(string compilationId) => GetCompilation(compilationId).Run();

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

//TODO: Work with source text, rather than compilations - how do we resolve metadata references?? Custom ALC??

public class CodeSession
{
    private readonly Guid _id = Guid.NewGuid();
    private readonly DocumentOptions _options;

    public CodeSession(CSharpCompilation compilation, DocumentOptions? options = null)
    {
        Compilation = compilation;
        _options = options ?? DocumentOptions.Default;

        var text = compilation.SyntaxTrees.FirstOrDefault()?.GetText() ?? SourceText.From("");
        _sourceText = text;
        Workspace = new AdhocWorkspace();
        var projectId = ProjectId.CreateNewId();
        var docId = DocumentId.CreateNewId(projectId, "WasmSharp.CodeSession");
        Solution = Workspace.CurrentSolution
            .AddProject(projectId, "WasmSharp.Project.CodeSession", "project-assembly", LanguageNames.CSharp)
            .AddDocument(docId, "WasmSharp.CodeSession.Document", text);
        Workspace.OpenDocument(docId);
        Solution = Solution.AddMetadataReferences(projectId, MetadataReferenceCache.MetadataReferences);
        _currentDocument = Solution.GetDocument(docId)!;
    }

    public CSharpCompilation Compilation { get; private set; }

    public AdhocWorkspace Workspace { get; set; }
    public Solution Solution { get; set; }


    //TODO: Verify if we actually need source text

    private SourceText _sourceText;
    public SourceText SourceText
    {
        get => _sourceText;
        private set
        {
            if (value == _sourceText)
            {
                return;
            }

            _sourceText = value;
            _outOfDate = true;
        }
    }

    private Microsoft.CodeAnalysis.Document _currentDocument;
    public Microsoft.CodeAnalysis.Document CurrentDocument
    {
        get
        {
            EnsureUpToDate();
            return _currentDocument;
        }
    }

    private bool _outOfDate = false;

    private void EnsureUpToDate()
    {
        if (!_outOfDate)
        {
            return;
        }
        _currentDocument = _currentDocument.WithText(_sourceText);
        //Workspace.TryApplyChanges(Solution);
        //_currentDocument = Workspace.CurrentSolution.GetDocument(_currentDocument.Id)!;
        _outOfDate = false;
    }

    public void Recompile(string code)
    {
        using var t = new Tracer("Updating source text");
        SourceText = SourceText.From(code);
    }

    public async Task<IEnumerable<Diagnostic>> GetDiagnosticsAsync()
    {
        using var t = new Tracer("Fetching diagnostics");
        var compilation = (await CurrentDocument.Project.GetCompilationAsync())!;
        return compilation.GetDiagnostics().Select(x => new Diagnostic(x.Id, x.GetMessage(), x.Location.SourceSpan, x.Severity));
    }

    public async Task<IEnumerable<CompletionItem>> GetCompletionsAsync(int caretPosition)
    {
        CompletionService? completionService = null;
        using (var t = new Tracer("Fetching completion service"))
        {
            completionService = CompletionService.GetService(CurrentDocument);
        }
        if (completionService is null)
        {
            Console.WriteLine($"Could not find completion service for document '{CurrentDocument.Name}'.");
            return Array.Empty<CompletionItem>();
        }
        using var t2 = new Tracer("Fetching completions");
        //Console.WriteLine($"caretPosition: {caretPosition}");
        //var tree = await CurrentDocument.GetSyntaxTreeAsync();
        //Console.WriteLine($"CurrentDocument: {tree}");
        var completions = await completionService.GetCompletionsAsync(CurrentDocument, caretPosition);
        return completions.ItemsList.Select(x => new CompletionItem(x.DisplayText, x.SortText, x.InlineDescription, x.Tags, x.Span));
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
