using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.Text;

namespace WasmSharp.Core.Services;

public class Diagnostic(string id, string message, TextSpan location, DiagnosticSeverity severity)
{
    public string Id { get; set; } = id;
    public string Message { get; set; } = message;
    public TextSpan Location { get; set; } = location;
    public string Severity { get; set; } = severity.ToString();
}
