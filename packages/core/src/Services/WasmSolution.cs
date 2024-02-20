using System.Collections.Concurrent;
using Microsoft.CodeAnalysis;
using Microsoft.Extensions.Logging;
using WasmSharp.Core.Platform;

namespace WasmSharp.Core.Services;

/// <summary> 
/// Compiles C# code inside the browser.
/// </summary>
internal sealed class WasmSolution(ILogger<WasmSolution> logger)
{
    private static readonly Dictionary<string, CodeSession> CompilationCache = [];
    private readonly ILogger<WasmSolution> _logger = logger;

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

    public string CreateCompilation(string code, DocumentOptions? options = null)
    {
        _logger.LogTrace($"Creating new compilation.");
        var wasmCompilation = new CodeSession(code, options);
        var compilationId = Guid.NewGuid().ToString();
        CompilationCache.Add(compilationId, wasmCompilation);
        return compilationId;
    }

    public void Recompile(string compilationId, string code) => GetCompilation(compilationId).Recompile(code);
    public Task<IEnumerable<Diagnostic>> GetDiagnosticsAsync(string compilationId) => GetCompilation(compilationId).GetDiagnosticsAsync();
    public Task<IEnumerable<CompletionItem>> GetCompletionsAsync(string compilationId, int caretPosition) => GetCompilation(compilationId).GetCompletionsAsync(caretPosition);
    public Task<bool> ShouldTriggerCompletionAsync(string compilationId, int caretPosition) => GetCompilation(compilationId).ShouldTriggerCompletions(caretPosition);
    public Task<bool> ShouldTriggerCompletionAsync(string compilationId, int caretPosition, char @char, CharacterOperation operation) => GetCompilation(compilationId).ShouldTriggerCompletions(caretPosition, @char, operation);
    public Task<RunResult> RunAsync(string compilationId) => GetCompilation(compilationId).RunAsync();

#pragma warning disable CA1822 // Mark members as static
    private CodeSession GetCompilation(string compilationId)
#pragma warning restore CA1822 // Mark members as static
    {
        if (!CompilationCache.TryGetValue(compilationId, out var compilation))
        {
            //TODO: Better custom exception/message/return bool and don't throw at all?
            throw new InvalidOperationException("compilation ID not recognised");
        }
        return compilation;
    }
}
