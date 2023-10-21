using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.Text;

namespace WasmSharp.Core.Services;

public class Diagnostic
{
    public Diagnostic(string id, string message, TextSpan location, DiagnosticSeverity severity)
    {
        Id = id;
        Message = message;
        Location = location;
        Severity = severity.ToString();
    }

    public string Id { get; set; }
    public string Message { get; set; }
    public TextSpan Location { get; set; }
    public string Severity { get; set; }
}
