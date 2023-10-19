using System.Diagnostics;

namespace WasmSharp.Core.CompilationServices;

internal sealed class Tracer : IDisposable
{
    private readonly DateTime _startTime = DateTime.UtcNow;
    private readonly string _actionName;

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
        Console.WriteLine($"{_actionName}: {(endTime - _startTime).TotalMilliseconds}ms");
    }
}
