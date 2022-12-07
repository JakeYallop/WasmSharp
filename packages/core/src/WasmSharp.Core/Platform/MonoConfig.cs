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
