using System;
using System.Diagnostics.Metrics;
using System.Runtime.InteropServices.JavaScript;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.CodeAnalysis;
using WasmSharp.Core.CodeSession;
using WasmSharp.Core.Document;

Console.WriteLine("Hello, Browser!");

//TODO: Hosting??

public static partial class CompilationInterop
{
    private static readonly JsonSerializerOptions DefaultOptions = new(JsonSerializerDefaults.Web);

    [JSImport("utils.prettyPrint", "main.js")]
    public static partial void PrettyPrint(string s);

    //TODO: Make idempotent

    [JSExport]
    public static async Task InitAsync(string publicUrl, string monoConfigJson)
    {
        Console.WriteLine($"Loading files from {publicUrl}");
        var monoConfig = JsonSerializer.Deserialize<MonoConfig>(monoConfigJson, DefaultOptions)!;
        Console.WriteLine("Successfully deserialized config.");
        await WasmSolution.InitializeAsync(publicUrl, monoConfig);
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
        //Console.WriteLine($"Recompiling \n{code}.");
        WasmSolution.Recompile(compilationId, code);
    }

    [JSExport]
    public static async Task<string> GetDiagnosticsAsync(string compilationId) {
        var diagnostics = await WasmSolution.GetDiagnosticsAsync(compilationId);
        return JsonSerializer.Serialize(diagnostics, DefaultOptions)!;
    }


    [JSExport]
    public static string Run(string compilationId) => JsonSerializer.Serialize(WasmSolution.Run(compilationId), DefaultOptions);

    [JSExport]
    public static async Task<string> GetCompletionsAsync(string compilationId, int caretPosition)
    {
        var completions = await WasmSolution.GetCompletionsAsync(compilationId, caretPosition);
        return JsonSerializer.Serialize(completions, DefaultOptions);
    }
}
