using System;
using System.Diagnostics.Metrics;
using System.Runtime.InteropServices.JavaScript;
using System.Text.Json;
using static System.Runtime.InteropServices.JavaScript.JSType;

Console.WriteLine("Hello, Browser!");

public partial class Compiler
{
    [JSExport]
    public static Task InitAsync([JSMarshalAs<JSType.String>] string monoConfig)
    {
        var config = JsonSerializer.Deserialize<MonoConfig>(monoConfig);
        return Task.CompletedTask;
    }
}

public record AssetBehaviour
{
    private AssetBehaviour(string behaviour)
    {
        Behaviour = behaviour;
    }

    public string Behaviour { get; }

    public static AssetBehaviour Resource = new("resource");
    public static AssetBehaviour Assembly = new("assembly");
    public static AssetBehaviour Pdb = new("pdb");
    public static AssetBehaviour Heap = new("heap");
    public static AssetBehaviour Icu = new("icu");
    public static AssetBehaviour Vfs = new("vfs");
    public static AssetBehaviour DotnetWasm = new("dotnetwasm");
    public static AssetBehaviour JsModuleThreads = new("js-module-threads");
}

public class ResourceRequest
{
    public string Name { get; private set; }
    public string Behaviour { get; private set; }
    public string ResolvedUrl { get; private set; }
    public string Hash { get; private set; }
}

public class AssetEntry : ResourceRequest
{
    /// <summary>
    /// If specified, overrides the path of the asset in the virtual filesystem and similar data structures once downloaded.
    /// </summary>
    public string? VirtualPath { get; private set; }
    /// <summary>
    /// Culture code.
    /// </summary>
    public string? Culture { get; private set; }
    /// <summary>
    /// If true, an attempt will be made to load the asset from each location in MonoConfig.remoteSources.
    /// </summary>
    public bool LoadRemote { get; private set; }
    /// <summary>
    /// If true, the runtime startup would not fail if the asset download was not successful.
    /// </summary>
    public bool IsOptional { get; private set; }
    /// <summary>
    /// If provided, runtime doesn't have to fetch the data. Runtime would set the buffer to null after instantiation to free the memory.
    /// </summary>
    public byte[]? Buffer {  get; private set; }
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
    public ICollection<AssetEntry> Assets { get; set; }

    /// <summary>
    /// Additional search locations for assets.
    /// </summary>
    public string[] RemoteSources { get; set; }
};
