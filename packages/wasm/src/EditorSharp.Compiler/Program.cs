using System;
using System.Diagnostics.Metrics;
using System.Runtime.InteropServices.JavaScript;
using System.Text.Json;
using System.Text.Json.Nodes;
using EditorSharp.Compiler;
using Microsoft.CodeAnalysis;

Console.WriteLine("Hello, Browser!");

public static partial class CompilationInterop
{
    private static readonly JsonSerializerOptions DefaultOptions = new(JsonSerializerDefaults.Web);

    [JSImport("utils.prettyPrint", "main.js")]
    public static partial void PrettyPrint(string s);

    [JSExport]
    public static async Task InitAsync(string publicUrl, string monoConfigJson)
    {
        Console.WriteLine($"Loading files from {publicUrl}");
        var monoConfig = JsonSerializer.Deserialize<MonoConfig>(monoConfigJson, DefaultOptions)!;
        Console.WriteLine("Successfully deserialized config.");
        await WasmCompiler.InitializeAsync(publicUrl, monoConfig);
    }

    [JSExport]
    public static string CreateNewCompilation(string code)
    {
        var compilationId = WasmCompiler.CreateCompilation(code);
        return compilationId;
    }

    [JSExport]
    public static void Recompile(string compilationId, string code) => WasmCompiler.Recompile(compilationId, code);

    [JSExport]
    public static string GetDiagnostics(string compilationId) => JsonSerializer.Serialize(WasmCompiler.GetDiagnostics(compilationId), DefaultOptions)!;

    [JSExport]
    public static string Run(string compilationId) => JsonSerializer.Serialize(WasmCompiler.Run(compilationId), DefaultOptions);
}

public record AssetBehaviour
{
    private AssetBehaviour(string behaviour)
    {
        Value = behaviour;
    }

    public string Value { get; }

    public static AssetBehaviour Resource { get; } = new("resource");
    public static AssetBehaviour Assembly { get; } = new("assembly");
    public static AssetBehaviour Pdb { get; } = new("pdb");
    public static AssetBehaviour Heap { get; } = new("heap");
    public static AssetBehaviour Icu { get; } = new("icu");
    public static AssetBehaviour Vfs { get; } = new("vfs");
    public static AssetBehaviour DotnetWasm { get; } = new("dotnetwasm");
    public static AssetBehaviour JsModuleThreads { get; } = new("js-module-threads");
}

public class ResourceRequest
{
    public string Name { get; set; }
    public string Behavior { get; set; }
    public string ResolvedUrl { get; set; }
    public string Hash { get; set; }
}

public class AssetEntry : ResourceRequest
{
    /// <summary>
    /// If specified, overrides the path of the asset in the virtual filesystem and similar data structures once downloaded.
    /// </summary>
    public string? VirtualPath { get; set; }
    /// <summary>
    /// Culture code.
    /// </summary>
    public string? Culture { get; set; }
    /// <summary>
    /// If true, an attempt will be made to load the asset from each location in MonoConfig.remoteSources.
    /// </summary>
    public bool LoadRemote { get; set; }
    /// <summary>
    /// If true, the runtime startup would not fail if the asset download was not successful.
    /// </summary>
    public bool IsOptional { get; set; }
    /// <summary>
    /// If provided, runtime doesn't have to fetch the data. Runtime would set the buffer to null after instantiation to free the memory.
    /// </summary>
    public byte[]? Buffer { get; set; }
}

public class MonoConfig
{
    /// <summary>
    /// The subfolder containing managed assemblies and pdbs. This is relative to dotnet.js script.
    /// </summary>
    public string AssemblyRootFolder { get; set; }

    /// <summary>
    /// A list of assets to load along with the runtime.
    /// </summary>
    public List<AssetEntry> Assets { get; set; }

    /// <summary>
    /// Additional search locations for assets.
    /// </summary>
    public string[] RemoteSources { get; set; }
};
