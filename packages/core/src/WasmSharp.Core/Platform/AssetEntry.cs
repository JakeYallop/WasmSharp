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
