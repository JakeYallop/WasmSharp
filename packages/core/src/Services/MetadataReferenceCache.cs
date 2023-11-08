using Microsoft.CodeAnalysis;

namespace WasmSharp.Core.Services;

public static class MetadataReferenceCache
{
    public static readonly Dictionary<string, Compilation> Compilations = new();
    public static IReadOnlyCollection<MetadataReference> MetadataReferences => _metadataReferences.AsReadOnly();
#pragma warning disable IDE0079 // Remove unnecessary suppression
#pragma warning disable IDE1006 // Naming Styles
    private static readonly List<MetadataReference> _metadataReferences = new();
#pragma warning restore IDE1006 // Naming Styles
#pragma warning restore IDE0079 // Remove unnecessary suppression

    public static void AddReference(MetadataReference reference)
    {
        _metadataReferences.Add(reference);
    }

}
