using System;
using System.Diagnostics.Metrics;
using System.Runtime.InteropServices.JavaScript;
using System.Text.Json;
using Microsoft.CodeAnalysis;

Console.WriteLine("Hello, Browser!");

public static class GlobalCache
{
    public static bool HasLoaded { get; set; }
}

//TODO: Design this as a console app

//TODO: Investigate using dotnet serve or similar to get actual paths to configs and build custom loader

//TODO: Move to typescript!!

public static partial class Compiler
{
    [JSImport("utils.prettyPrint", "main.js")]
    public static partial void PrettyPrint(string s);

    [JSExport]
    public static async Task InitAsync([JSMarshalAs<JSType.Array<JSType.String>>] string[] loadedFiles)
    {
        Console.WriteLine("Loaded files");
        PrettyPrint(JsonSerializer.Serialize(loadedFiles));
    }
}

public record AssetBehaviour
{
    private AssetBehaviour(string behaviour)
    {
        Behaviour = behaviour;
    }

    public string Behaviour { get; }

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
    public byte[]? Buffer { get; private set; }
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
