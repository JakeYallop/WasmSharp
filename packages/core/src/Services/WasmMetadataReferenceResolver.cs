using Microsoft.CodeAnalysis;

namespace WasmSharp.Core.Services;

public class WasmMetadataReferenceResolver
{
    private static readonly HttpClient Client = new();

#pragma warning disable CA1822 // Mark members as static
    public async Task<MetadataReference> ResolveReferenceAsync(string assembly)
#pragma warning restore CA1822 // Mark members as static
    {
        var url = new Uri(assembly, UriKind.Absolute);
        var response = await Client.GetAsync(url).ConfigureAwait(false);
        var byteStream = await response.Content.ReadAsStreamAsync().ConfigureAwait(false);
        return MetadataReference.CreateFromStream(byteStream, new(MetadataImageKind.Assembly), filePath: url.AbsolutePath);
    }
}
