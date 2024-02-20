using Microsoft.Extensions.Logging;
using WasmSharp.Core.Hosting;

namespace WasmSharp.Core.Services;

internal sealed class Tracer(string actionName) : IDisposable
{
    private readonly DateTime _startTime = DateTime.UtcNow;
    private readonly string _actionName = actionName;
    private readonly ILogger<Tracer> _logger = Host.Services.GetService<ILogger<Tracer>>();

    public static Tracer Trace(string actionName)
    {
        var tracer = new Tracer(actionName);
        return tracer;
    }

    public void Dispose()
    {
        var endTime = DateTime.UtcNow;
        _logger.LogDebug($"{_actionName} took {(endTime - _startTime).TotalMilliseconds}ms");
    }
}
