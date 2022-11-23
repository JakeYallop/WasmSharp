using System.Reflection;
using Microsoft.CodeAnalysis;

namespace EditorSharp.Compiler;

public class WasmMetadataReferenceResolver : DynamicMetadataReferenceResolver
{
    private static readonly HttpClient Client = new();
    public WasmMetadataReferenceResolver(string publicUrl)
    {
        Client.BaseAddress = new Uri(publicUrl, UriKind.Absolute);
    }

    public override Task<MetadataReference> ResolveReferenceAsync(Assembly assembly)
    {
        throw new NotImplementedException();
    }

    public async Task<MetadataReference> ResolveReferenceAsync(string rootFolder, string assembly)
    {
        Console.WriteLine("Resolving dynamic assembly: " + assembly);
        var url = rootFolder + "/" + assembly;
        var response = await Client.GetAsync(url);
        var byteStream = await response.Content.ReadAsStreamAsync();
        return MetadataReference.CreateFromStream(byteStream);
    }
}
