using System.Collections.Immutable;
using System.Reflection;
using System.Text.Json;
using Microsoft.CodeAnalysis;

namespace WasmSharp.Core.Services;

public class WebAssemblyMetadataReferenceResolver : MetadataReferenceResolver, IEquatable<WebAssemblyMetadataReferenceResolver>
{
    //TODO: inject this via a WebAssemblyMetadataReferenceResolverFactory?
    private static readonly HttpClient Client = new();
    private readonly string _publicUrl;
    public WebAssemblyMetadataReferenceResolver(string publicUrl)
    {
        //TODO: Uncomment
        //if (Path.GetExtension(publicUrl) is not "" || !Uri.IsWellFormedUriString(publicUrl, UriKind.Absolute))
        //{
        //    throw new ArgumentException($"Uri '{publicUrl}' should be a directory, and is not well formed.", nameof(publicUrl));
        //}
        _publicUrl = publicUrl;
    }

    public override bool Equals(object? other)
    {
        //TODO: Implement
        return true;
    }

    public bool Equals(WebAssemblyMetadataReferenceResolver? other)
    {
        //TODO: Implement
        return true;
    }

    public override int GetHashCode()
    {
        //TODO: Implement
        return 0;
    }

    public override bool ResolveMissingAssemblies => true;

    public override PortableExecutableReference? ResolveMissingAssembly(MetadataReference definition, AssemblyIdentity referenceIdentity)
    {
        //TODO: Implement
        Console.WriteLine($"ResolveMissingAssembly: MetadataReference is {definition?.Display}.");
        Console.WriteLine($"ResolveMissingAssembly: AssemblyIdentity is {referenceIdentity}.");

        return base.ResolveMissingAssembly(definition!, referenceIdentity);
    }

    //MetadataReference inherits PortableExecutableReference so we can just return the derived type
    public override ImmutableArray<PortableExecutableReference> ResolveReference(string reference, string? baseFilePath, MetadataReferenceProperties properties)
    {
        Console.WriteLine($"ResolveReference: Reference is {reference}.");
        Console.WriteLine($"ResolveReference: BaseFilePath is {reference}.");
        Console.WriteLine($"ResolveReference: properties are {JsonSerializer.Serialize(properties)}.");
        return [];
    }

    private async Task<MetadataReference> ResolveReferenceAsync(string rootFolder, string assembly)
    {
        var url = new Uri(Path.Combine(_publicUrl, rootFolder, assembly));
        //Console.WriteLine($"Resolving dynamic assembly from {url}.");
        var response = await Client.GetAsync(url).ConfigureAwait(false);
        var byteStream = await response.Content.ReadAsStreamAsync().ConfigureAwait(false);
        return MetadataReference.CreateFromStream(byteStream, new(MetadataImageKind.Assembly));
    }
}
