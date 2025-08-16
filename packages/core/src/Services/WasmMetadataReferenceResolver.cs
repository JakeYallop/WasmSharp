using System.Reflection;
using Microsoft.CodeAnalysis;

namespace WasmSharp.Core.Services;

public class WasmMetadataReferenceResolver : MetadataReferenceResolver
{
    private static readonly HttpClient Client = new();
    private readonly string _publicUrl;
    public WasmMetadataReferenceResolver(string publicUrl)
    {
        if (Path.GetExtension(publicUrl) is not "" || !Uri.IsWellFormedUriString(publicUrl, UriKind.Absolute))
        {
            throw new ArgumentException($"Uri '{publicUrl}' should be a directory, and is not well formed.", nameof(publicUrl));
        }
        _publicUrl = publicUrl;
    }

    public override Task<MetadataReference> ResolveReferenceAsync(Assembly assembly)
    {
        throw new NotImplementedException();
    }

    public async Task<MetadataReference> ResolveReferenceAsync(string rootFolder, string assembly)
    {
        var url = new Uri(Path.Combine(_publicUrl, rootFolder, assembly));
        var response = await Client.GetAsync(url).ConfigureAwait(false);
        var byteStream = await response.Content.ReadAsStreamAsync().ConfigureAwait(false);
        return MetadataReference.CreateFromStream(byteStream, new(MetadataImageKind.Assembly), filePath: url.AbsolutePath);
    }
}
