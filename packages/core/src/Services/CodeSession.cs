using System.Diagnostics.CodeAnalysis;
using System.Reflection;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.Completion;
using Microsoft.CodeAnalysis.Text;
using Microsoft.Extensions.Logging;
using WasmSharp.Core.Hosting;

namespace WasmSharp.Core.Services;

internal sealed class CodeSession
{
    private static readonly SourceText EmptySourceText = SourceText.From("");
    private readonly ILogger<CodeSession> _logger = Host.Services.GetService<ILogger<CodeSession>>();
    public CodeSession(string? code, DocumentOptions? options = null)
    {
        _sourceText = code is null ? EmptySourceText : SourceText.From(code);
        Workspace = new AdhocWorkspace();
        var projectId = ProjectId.CreateNewId();
        var docId = DocumentId.CreateNewId(projectId, "WasmSharp.CodeSession");
        Solution = Workspace.CurrentSolution
            .AddProject(projectId, "WasmSharp.Project.CodeSession", "project-assembly", LanguageNames.CSharp)
            .AddDocument(docId, "WasmSharp.CodeSession.Document", _sourceText);
        Workspace.OpenDocument(docId);
        Solution = Solution.AddMetadataReferences(projectId, MetadataReferenceCache.MetadataReferences);
        Solution = Solution.WithProjectCompilationOptions(projectId, options?.CSharpCompilationOptions ?? DocumentOptions.DefaultCompilationOptions);
        Solution = Solution.WithProjectParseOptions(projectId, options?.CSharpParseOptions ?? DocumentOptions.DefaultParseOptions);
        _currentDocument = Solution.GetDocument(docId)!;
    }

    public AdhocWorkspace Workspace { get; set; }
    public Solution Solution { get; set; }

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
        _logger.LogTrace("Workspace is out of date");
        _currentDocument = _currentDocument.WithText(SourceText);
        Workspace.TryApplyChanges(_currentDocument.Project.Solution);
        _outOfDate = false;
    }

    public void Recompile(string code)
    {
        _logger.LogDebug("Recompiling");
        SourceText = SourceText.From(code);
        EnsureUpToDate();
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
            var assembly = LoadAssembly(ms.ToArray());
            Console.WriteLine($"assembly: {assembly.FullName}");
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
            var errorOut = "";
#pragma warning disable CA1031 // Do not catch general exception types
            try
            {
                assembly.EntryPoint!.Invoke(null, args);
            }
            catch (Exception ex)
            {
                var s = ex.ToString();
                errorOut = s;
                await Console.Error.WriteLineAsync(s).ConfigureAwait(false);
            }
            finally
            {
                Console.SetOut(oldOut);
            }
#pragma warning restore CA1031 // Do not catch general exception types
            var capturedOutput = captureOutput.ToString();

            Console.WriteLine("Captured output: ");
            Console.WriteLine(capturedOutput);

            return RunResult.WithStdOutErr(capturedOutput, errorOut);
        }
        else
        {
            return RunResult.Failure(result.Diagnostics.ToWasmSharpDiagnostics());
        }
    }

    [UnconditionalSuppressMessage("Trimming", "IL2026:Members annotated with 'RequiresUnreferencedCodeAttribute' require dynamic access otherwise can break functionality when trimming application code", Justification = "Method is called using in-memory emitted assemblies only, which will not be trimmed.")]
    private static Assembly LoadAssembly(byte[] bytes) => Assembly.Load(bytes);
}
