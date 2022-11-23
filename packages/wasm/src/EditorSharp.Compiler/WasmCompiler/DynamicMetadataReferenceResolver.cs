using System.Reflection;
using Microsoft.CodeAnalysis;

namespace EditorSharp.Compiler;

public abstract class DynamicMetadataReferenceResolver
{
    public abstract Task<MetadataReference> ResolveReferenceAsync(Assembly assembly);
}
