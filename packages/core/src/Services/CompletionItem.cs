using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.Text;

namespace WasmSharp.Core.Services;


/// <summary>
/// One of many possible completions used to form the completion list presented to the user.
/// </summary>
/// <param name="DisplayText"></param>
/// <param name="SortText"></param>
/// <param name="Tags">A collection of <see cref="TextTags"/>. A tag or multiple tags can influence how the item is displayed.</param>
/// <param name="Span"></param>
public record CompletionItem(string DisplayText, string SortText, string InlineDescription, ImmutableArray<string> Tags, TextSpan Span);
