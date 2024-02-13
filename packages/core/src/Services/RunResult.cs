namespace WasmSharp.Core.Services;

public class RunResult
{
    private RunResult() { }

    public static RunResult WithStdOutErr(string stdOut, string stdErr) => new()
    {
        Success = true,
        StdOut = stdOut,
        StdErr = stdErr
    };

    public static RunResult Failure(IEnumerable<Diagnostic> diagnostics)
    => new()
    {
        Diagnostics = diagnostics.ToArray()
    };

    public bool Success { get; init; }
    public string? StdOut { get; init; }
    public string? StdErr { get; init; }
    public Diagnostic[] Diagnostics { get; init; } = [];
}
