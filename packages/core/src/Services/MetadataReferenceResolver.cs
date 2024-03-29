﻿using System.Reflection;
using Microsoft.CodeAnalysis;

namespace WasmSharp.Core.Services;

public abstract class MetadataReferenceResolver
{
    public abstract Task<MetadataReference> ResolveReferenceAsync(Assembly assembly);
}
