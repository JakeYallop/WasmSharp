using System.Runtime.InteropServices.JavaScript;
using System.Text.Json;
using WasmSharp.Core.Platform;
using WasmSharp.Core.CompilationServices;
using System.Text.Json.Serialization;

namespace WasmSharp.Core;

public sealed partial class CompilationInterop
{
    [JSImport("utils.prettyPrint", "main.js")]
    public static partial void PrettyPrint(string s);

    //TODO: Make idempotent
    //TODO: Rename monoConfigJson to blazorConfig
    [JSExport]
    public static async Task InitAsync(string publicUrl, string bootJsonData)
    {
        Console.WriteLine($"Loading files from {publicUrl}");
        Console.WriteLine($"{bootJsonData}");
        var monoConfig = JsonSerializer.Deserialize<BootJsonData>(bootJsonData, JsonContext.Default.BootJsonData)!;
        Console.WriteLine("Successfully deserialized config.");
        await WasmSolution.InitializeAsync(publicUrl, monoConfig).ConfigureAwait(false);
    }

    [JSExport]
    public static string CreateNewCompilation(string code)
    {
        var compilationId = WasmSolution.CreateCompilation(code);
        return compilationId;
    }

    [JSExport]
    public static void Recompile(string compilationId, string code)
    {
        WasmSolution.Recompile(compilationId, code);
    }

    [JSExport]
    public static async Task<string> GetDiagnosticsAsync(string compilationId)
    {
        var diagnostics = await WasmSolution.GetDiagnosticsAsync(compilationId).ConfigureAwait(false);
        return JsonSerializer.Serialize(diagnostics, JsonContext.Default.Diagnostics)!;
    }


    [JSExport]
    public static async Task<string> RunAsync(string compilationId) => JsonSerializer.Serialize(await WasmSolution.RunAsync(compilationId).ConfigureAwait(false), JsonContext.Default.RunResult);

    [JSExport]
    public static async Task<string> GetCompletionsAsync(string compilationId, int caretPosition)
    {
        var completions = await WasmSolution.GetCompletionsAsync(compilationId, caretPosition).ConfigureAwait(false);
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
