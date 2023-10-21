using System;
using System.Diagnostics.Metrics;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization.Metadata;
using Microsoft.CodeAnalysis.Diagnostics;
using System.ComponentModel;
using System.Reflection.Emit;
using WasmSharp.Core.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

[assembly: System.Runtime.Versioning.SupportedOSPlatform("browser")]

namespace WasmSharp.Core;

public sealed class Program
{
    public static void Main(string[] _)
    {
        //main does not appear to actually be called
    }
}
