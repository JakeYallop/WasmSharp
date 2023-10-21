using System.Diagnostics;
using Microsoft.AspNetCore.Components.WebAssembly.Services;
using Microsoft.Extensions.Logging;
using WasmSharp.Core.Hosting;

namespace WasmSharp.Core.Services;

internal sealed class Tracer : IDisposable
{
    private readonly DateTime _startTime = DateTime.UtcNow;
    private readonly string _actionName;
    private readonly ILogger<Tracer> _logger = Host.Services.GetService<ILogger<Tracer>>();

    public Tracer(string actionName)
    {
        _actionName = actionName;
    }

    public static Tracer Trace(string actionName)
    {
        var tracer = new Tracer(actionName);
        return tracer;
    }

    public void Dispose()
    {
        var endTime = DateTime.UtcNow;
        _logger.LogInformation($"{_actionName}: {(endTime - _startTime).TotalMilliseconds}ms");
    }
}