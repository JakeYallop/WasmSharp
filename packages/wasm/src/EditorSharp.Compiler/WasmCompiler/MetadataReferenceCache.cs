using Microsoft.CodeAnalysis;

namespace EditorSharp.Compiler;

public static class MetadataReferenceCache
{
    public static readonly Dictionary<string, Compilation> Compilations = new();
    public static IReadOnlyCollection<MetadataReference> MetadataReferences => _metadataReferences.AsReadOnly();
    public static readonly List<MetadataReference> _metadataReferences = new();

    public static void AddReference(MetadataReference reference)
    {
        _metadataReferences.Add(reference);
    }

}
