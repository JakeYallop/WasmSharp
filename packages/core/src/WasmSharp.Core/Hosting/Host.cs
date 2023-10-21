using System.Diagnostics;
using Jab;
using Microsoft.AspNetCore.Components.WebAssembly.Services;
using Microsoft.Extensions.Logging;
using WasmSharp.Core.Services;

namespace WasmSharp.Core.Hosting;

internal static class Host
{
    public static WasmSharpServiceProvider Services { get; } = new();

    public static void Dispatch(Action<WasmSolution> action)
    {
        var solution = Services.GetService<WasmSolution>();
        action(solution);
    }

    public static T Dispatch<T>(Func<WasmSolution, T> action)
    {
        var solution = Services.GetService<WasmSolution>();
        return action(solution);
    }

    public static Task Dispatch(Func<WasmSolution, Task> action)
    {
        var solution = Services.GetService<WasmSolution>();
        return action(solution);
    }

    public static Task<T> Dispatch<T>(Func<WasmSolution, Task<T>> action)
    {
        var solution = Services.GetService<WasmSolution>();
        return action(solution);
    }
}

[ServiceProvider]
[Singleton(typeof(ILogger<>), typeof(WebAssemblyConsoleLogger<>))]
[Singleton<WasmSolution>]
internal sealed partial class WasmSharpServiceProvider : IServiceProvider { }

//The below currently does not work as Jab does not generate service resolution methods when
//resolving through an extension method.
//TODO: Open PR/Create fork of jab to allow use of IServiceProvider interface?
public static class WasmSharpServiceProviderExtensions
{
    public static T GetService<T>(this IServiceProvider serviceProvider)
    {
        if (serviceProvider is WasmSharpServiceProvider wasmSharpServiceProvider)
        {
            return wasmSharpServiceProvider.GetService<T>();
        }
        throw new UnreachableException();
    }
}
