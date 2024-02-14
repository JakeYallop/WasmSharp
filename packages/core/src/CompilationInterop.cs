using System.Runtime.InteropServices.JavaScript;
using System.Text.Json;
using WasmSharp.Core.Platform;
using WasmSharp.Core.Services;
using System.Text.Json.Serialization;
using WasmSharp.Core.Hosting;
using Microsoft.Extensions.Logging;

namespace WasmSharp.Core;

#pragma warning disable CA1812 // Avoid uninstantiated internal classes
internal sealed partial class CompilationInterop
#pragma warning restore CA1812 // Avoid uninstantiated internal classes
{
    [JSImport("utils.prettyPrint", "main.js")]
    public static partial void PrettyPrint(string s);

    //TODO: Make idempotent
    [JSExport]
    public static Task InitAsync(string publicUrl, string bootJsonData)
    {
        var logger = Host.Services.GetService<ILogger<CompilationInterop>>();
        logger.LogInformation($"Loading files from {publicUrl}");
        var monoConfig = JsonSerializer.Deserialize(bootJsonData, JsonContext.Default.BootJsonData)!;
        logger.LogInformation("Successfully deserialized config.");
        return Host.Dispatch(solution => WasmSolution.InitializeAsync(publicUrl, monoConfig));
    }

    [JSExport]
    public static string CreateNewCompilation(string code)
    {
        var compilationId = Host.Dispatch(s => s.CreateCompilation(code));
        return compilationId;
    }

    [JSExport]
    public static void Recompile(string compilationId, string code)
    {
        Host.Dispatch(s => s.Recompile(compilationId, code));
    }

    [JSExport]
    public static async Task<string> GetDiagnosticsAsync(string compilationId)
    {
        var diagnostics = await Host.Dispatch(s => s.GetDiagnosticsAsync(compilationId)).ConfigureAwait(false);
        return JsonSerializer.Serialize(diagnostics, JsonContext.Default.Diagnostics)!;
    }


    [JSExport]
    public static async Task<string> RunAsync(string compilationId) => JsonSerializer.Serialize(await Host.Dispatch(s => s.RunAsync(compilationId)).ConfigureAwait(false), JsonContext.Default.RunResult);

    [JSExport]
    public static async Task<string> GetCompletionsAsync(string compilationId, int caretPosition)
    {
        var completions = await Host.Dispatch(s => s.GetCompletionsAsync(compilationId, caretPosition)).ConfigureAwait(false);
        return JsonSerializer.Serialize(completions, JsonContext.Default.CompletionItems);
    }
}

[JsonSourceGenerationOptions(
    GenerationMode = JsonSourceGenerationMode.Metadata,
    PropertyNamingPolicy = JsonKnownNamingPolicy.CamelCase,
    PropertyNameCaseInsensitive = true,
    NumberHandling = JsonNumberHandling.Strict
)]
[JsonSerializable(typeof(IEnumerable<Diagnostic>), TypeInfoPropertyName = "Diagnostics")]
[JsonSerializable(typeof(IEnumerable<CompletionItem>), TypeInfoPropertyName = "CompletionItems")]
[JsonSerializable(typeof(BootJsonData))]
[JsonSerializable(typeof(RunResult))]
internal sealed partial class JsonContext : JsonSerializerContext
{
}
