using System.Reflection;
using Microsoft.CodeAnalysis;

namespace WasmSharp.Core;

public abstract class MetadataReferenceResolver
{
    public abstract Task<MetadataReference> ResolveReferenceAsync(Assembly assembly);
}
