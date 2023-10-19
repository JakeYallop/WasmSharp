using System.Reflection;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.Completion;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.Text;

namespace WasmSharp.Core.CompilationServices;

internal sealed class CodeSession
{

    public CodeSession(CSharpCompilation compilation, DocumentOptions? options = null)
    {
        Compilation = compilation;
        options ??= DocumentOptions.Default;

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

    private Document _currentDocument;
    public Document CurrentDocument
    {
        get
        {
            EnsureUpToDate();
            return _currentDocument;
        }
    }

    private bool _outOfDate;

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
        SourceText = SourceText.From(code);
    }

    public async Task<IEnumerable<Diagnostic>> GetDiagnosticsAsync()
    {
        using var t = new Tracer("Fetching diagnostics");
        var compilation = (await CurrentDocument.Project.GetCompilationAsync().ConfigureAwait(false))!;
        return compilation.GetDiagnostics().ToWasmSharpDiagnostics();
    }

    public async Task<IEnumerable<CompletionItem>> GetCompletionsAsync(int caretPosition)
    {
        EnsureUpToDate();
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
        //using var t2 = new Tracer("Fetching completions");
        //Console.WriteLine($"caretPosition: {caretPosition}");
        //var tree = await CurrentDocument.GetSyntaxTreeAsync();
        //Console.WriteLine($"CurrentDocument: {tree}");
        var completions = await completionService.GetCompletionsAsync(CurrentDocument, caretPosition).ConfigureAwait(false);
        return completions.ItemsList.Select(x => new CompletionItem(x.DisplayText, x.SortText, x.InlineDescription, x.Tags, x.Span));
    }

    public async Task<RunResult> RunAsync()
    {
        Console.WriteLine("Running...");
        var compilation = await CurrentDocument.Project.GetCompilationAsync().ConfigureAwait(false);
        var ms = new MemoryStream();
        var result = compilation!.Emit(ms);
        if (result.Success)
        {
            var assembly = Assembly.Load(ms.ToArray());
            Console.WriteLine($"assembly: {assembly.FullName}");
            Console.WriteLine($"assembly defined types: {assembly.DefinedTypes.ToArray()}");
            Console.WriteLine($"assembly entry point: {assembly.EntryPoint}");
            using var captureOutput = new StringWriter();
            var oldOut = Console.Out;
            Console.SetOut(captureOutput);
            var args = new[] { Array.Empty<string>() };
            //var instance = assembly.CreateInstance($"{Compilation.AssemblyName}.Program");
            //instance.GetType();
            //var mainMethod = instance.GetType().GetMethod("$Main");
            //Delegate d = Delegate.CreateDelegate(instance.GetType(), mainMethod);
            //d.DynamicInvoke();
            assembly.EntryPoint!.Invoke(null, args);
            var capturedOutput = captureOutput.ToString();
            Console.SetOut(oldOut);

            Console.WriteLine("Captured output: ");
            Console.WriteLine(capturedOutput);

            return RunResult.WithStdOutErr(capturedOutput, "");
        }
        else
        {
            return RunResult.Failure(result.Diagnostics.ToWasmSharpDiagnostics());
        }
    }
}
