﻿//Copied and edited from https://github.com/dotnet/runtime/blob/c657cb0265a36b1f24bcd4d9b61d249ce3b68e58/src/tasks/Microsoft.NET.Sdk.WebAssembly.Pack.Tasks/BootJsonData.cs

// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.
using ResourceHashesByNameDictionary = System.Collections.Generic.Dictionary<string, string>;

namespace WasmSharp.Core.Platform;

#nullable disable

/// <summary>
/// Defines the structure of dotnet.boot.js file.
/// </summary>
/// <remarks>
/// This file may be inlined by the build process into the dotnet.js file.
/// </remarks>
public class BootJsonData
{
    public string MainAssemblyName { get; set; }

    /// <summary>
    /// Gets or sets the application environment. This is typically used to differentiate
    /// between development, staging, and production environments.
    /// </summary>
    public string ApplicationEnvironment { get; set; }

    /// <summary>
    /// Gets the set of resources needed to boot the application. This includes the transitive
    /// closure of .NET assemblies (including the entrypoint assembly), the dotnet.wasm file,
    /// and any PDBs to be loaded.
    ///
    /// Within <see cref="ResourceHashesByNameDictionary"/>, dictionary keys are resource names,
    /// and values are SHA-256 hashes formatted in prefixed base-64 style (e.g., 'sha256-abcdefg...')
    /// as used for subresource integrity checking.
    /// </summary>
    public ResourcesData Resources { get; set; } = new ResourcesData();

    /// <summary>
    /// Gets a value that determines whether to enable caching of the <see cref="Resources"/>
    /// inside a CacheStorage instance within the browser.
    /// </summary>
    public bool? CacheBootResources { get; set; }

    /// <summary>
    /// Gets a value that determines if this is a debug build.
    /// </summary>
    public bool? DebugBuild { get; set; }

    /// <summary>
    /// Gets a value that determines what level of debugging is configured.
    /// </summary>
    public int DebugLevel { get; set; }

    /// <summary>
    /// Gets a value that determines if the linker is enabled.
    /// </summary>
    public bool? LinkerEnabled { get; set; }

    /// <summary>
    /// Config files for the application
    /// </summary>
    public IList<string> Appsettings { get; set; }

    /// <summary>
    /// Gets or sets the <see cref="ICUDataMode"/> that determines how icu files are loaded.
    /// </summary>
    /// <remarks>
    /// Deprecated since .NET 8. Use <see cref="GlobalizationMode"/> instead.
    /// </remarks>
    public GlobalizationMode? IcuDataMode { get; set; }

    /// <summary>
    /// Gets or sets the <see cref="Platform.GlobalizationMode"/> that determines how icu files are loaded.
    /// </summary>
    public string GlobalizationMode { get; set; }

    /// <summary>
    /// Gets a value for mono runtime options.
    /// </summary>
    public string[] RuntimeOptions { get; set; }

    /// <summary>
    /// Gets or sets configuration extensions.
    /// </summary>
    public Dictionary<string, Dictionary<string, object>> Extensions { get; set; }

    /// <summary>
    /// Gets or sets environment variables.
    /// </summary>
    public Dictionary<string, string> EnvironmentVariables { get; set; }

    /// <summary>
    /// Subset of runtimeconfig.json
    /// </summary>
    public RuntimeConfigData RuntimeConfig { get; set; }

    /// <summary>
    /// Gets or sets diagnostic tracing.
    /// </summary>
    public object DiagnosticTracing { get; set; }

    /// <summary>
    /// Gets or sets pthread pool initial size.
    /// </summary>
    public int? PthreadPoolInitialSize { get; set; }

    /// <summary>
    /// Gets or sets pthread pool unused size.
    /// </summary>
    public int? PthreadPoolUnusedSize { get; set; }
}


/// <summary>
/// Subset of runtimeconfig.json
/// </summary>
public class RuntimeConfigData
{
    /// <summary>
    /// Runtime options
    /// </summary>
    public RuntimeOptionsData RuntimeOptions { get; set; }
}

public class RuntimeOptionsData
{
    /// <summary>
    /// Config properties for the runtime
    /// </summary>
    public Dictionary<string, object> ConfigProperties { get; set; }
}

public class ResourcesData
{
    /// <summary>
    /// Gets a hash of all resources
    /// </summary>
    public string Hash { get; set; }

    public Dictionary<string, string> Fingerprinting { get; set; }

    /// <summary>
    /// .NET Wasm runtime resources (dotnet.wasm, dotnet.js) etc.
    /// </summary>
    /// <remarks>
    /// Deprecated in .NET 8, use <see cref="JsModuleWorker"/>, <see cref="JsModuleNative"/>, <see cref="JsModuleRuntime"/>, <see cref="WasmNative"/>, <see cref="WasmSymbols"/>, <see cref="Icu"/>.
    /// </remarks>
    public ResourceHashesByNameDictionary Runtime { get; set; }

    public ResourceHashesByNameDictionary JsModuleWorker { get; set; }

    public ResourceHashesByNameDictionary JsModuleDiagnostics { get; set; }

    public ResourceHashesByNameDictionary JsModuleNative { get; set; }

    public ResourceHashesByNameDictionary JsModuleRuntime { get; set; }

    public ResourceHashesByNameDictionary WasmNative { get; set; }

    public ResourceHashesByNameDictionary WasmSymbols { get; set; }

    public ResourceHashesByNameDictionary Icu { get; set; }

    /// <summary>
    /// "assembly" (.dll) resources needed to start MonoVM
    /// </summary>
    public ResourceHashesByNameDictionary CoreAssembly { get; set; } = [];

    /// <summary>
    /// "assembly" (.dll) resources
    /// </summary>
    public ResourceHashesByNameDictionary Assembly { get; set; } = [];

    /// <summary>
    /// "debug" (.pdb) resources needed to start MonoVM
    /// </summary>
    public ResourceHashesByNameDictionary CorePdb { get; set; }

    /// <summary>
    /// "debug" (.pdb) resources
    /// </summary>
    public ResourceHashesByNameDictionary Pdb { get; set; }

    /// <summary>
    /// localization (.satellite resx) resources
    /// </summary>
    public Dictionary<string, ResourceHashesByNameDictionary> SatelliteResources { get; set; }

    /// <summary>
    /// Assembly (.dll) resources that are loaded lazily during runtime
    /// </summary>
    public ResourceHashesByNameDictionary LazyAssembly { get; set; }

    /// <summary>
    /// JavaScript module initializers that Blazor will be in charge of loading.
    /// Used in .NET < 8
    /// </summary>
    public ResourceHashesByNameDictionary LibraryInitializers { get; set; }

    public ResourceHashesByNameDictionary ModulesAfterConfigLoaded { get; set; }

    public ResourceHashesByNameDictionary ModulesAfterRuntimeReady { get; set; }

    /// <summary>
    /// Extensions created by users customizing the initialization process. The format of the file(s)
    /// is up to the user.
    /// </summary>
    public Dictionary<string, ResourceHashesByNameDictionary> Extensions { get; set; }

    /// <summary>
    /// Additional assets that the runtime consumes as part of the boot process.
    /// </summary>
    public Dictionary<string, AdditionalAsset> RuntimeAssets { get; set; }

    public Dictionary<string, ResourceHashesByNameDictionary> CoreVfs { get; set; }

    public Dictionary<string, ResourceHashesByNameDictionary> Vfs { get; set; }

    public IList<string> RemoteSources { get; set; }
}

public enum GlobalizationMode : int
{
    // Note that the numeric values are serialized and used in JS code, so don't change them without also updating the JS code
    // Note that names are serialized as string and used in JS code

    /// <summary>
    /// Load optimized icu data file based on the user's locale
    /// </summary>
    Sharded = 0,

    /// <summary>
    /// Use the combined icudt.dat file
    /// </summary>
    All = 1,

    /// <summary>
    /// Do not load any icu data files.
    /// </summary>
    Invariant = 2,

    /// <summary>
    /// Load custom icu file provided by the developer.
    /// </summary>
    Custom = 3,
}

public class AdditionalAsset
{
    public string Hash { get; set; }

    public string Behavior { get; set; }
}
