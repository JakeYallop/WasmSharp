﻿using System.Globalization;
using Microsoft.CodeAnalysis;

namespace WasmSharp.Core.Services;

public static class DiagnosticCollectionExtensions
{
    public static Diagnostic[] MapDiagnostics(this Microsoft.CodeAnalysis.Diagnostic[] diagnostics)
    {
        return diagnostics.Select(x => new Diagnostic(x.Id, x.GetMessage(CultureInfo.CurrentCulture), x.Location.SourceSpan, x.Severity)).ToArray();
    }

    public static IEnumerable<Diagnostic> ToWasmSharpDiagnostics(this IEnumerable<Microsoft.CodeAnalysis.Diagnostic> diagnostics)
    {
        return diagnostics.Select(x => new Diagnostic(x.Id, x.GetMessage(CultureInfo.CurrentCulture), x.Location.SourceSpan, x.Severity));
    }
}
