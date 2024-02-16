import { EditorView } from "@codemirror/view";
import { Extension } from "@codemirror/state";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { palette } from "../theme.css";

//modified from https://github.com/codemirror/theme-one-dark/blob/834068627f48715d413bbebbe1af9498647d7b74/src/one-dark.ts

//Colors are based on the VSCode dark modern and Visual Studio themes, but are not an exact match for either
// color references:
// https://github.com/microsoft/vscode/blob/03510273fc85ff1d3b9e4f6321d1658f517c3d8c/extensions/theme-defaults/themes/dark_vs.json
// https://github.com/microsoft/vscode/blob/03510273fc85ff1d3b9e4f6321d1658f517c3d8c/extensions/theme-defaults/themes/dark_plus.json
// https://github.com/microsoft/vscode/blob/03510273fc85ff1d3b9e4f6321d1658f517c3d8c/extensions/theme-defaults/themes/dark_modern.json
// https://code.visualstudio.com/api/references/theme-color#editor-colors
// https://learn.microsoft.com/en-us/visualstudio/extensibility/ux-guidelines/color-value-reference-for-visual-studio?view=vs-2022#color-swatches-by-function

// specific colors
const textForeground = "#CCCCCC";
const background = "#1e1e1e";
const editorSelectionHighlightBackground = "#ADD6FF26";
const editorFindMatchBackground = "#9E6A03";
const lineNumberActiveForeground = "#CCCCCC";
const lineNumberForeground = "#6e7681";
const tooltipBackground = "#1f1f1f";
const tooltipBorderColor = "#3c3b3c";

//remaining OneDark theme colors. Colors that are no longer referenced have been removed
const chalky = "#e5c07b",
  coral = "#e06c75",
  cyan = "#56b6c2",
  invalid = "#ffffff",
  stone = "#7d8799", // Brightened compared to original to increase contrast
  malibu = "#61afef",
  sage = "#98c379",
  whiskey = "#d19a66",
  violet = "#c678dd",
  highlightBackground = "#2c313a",
  cursor = "#528bff";

export const darkModernTheme = EditorView.theme(
  {
    "&": {
      color: textForeground,
      backgroundColor: background,
    },

    ".cm-content": {
      caretColor: cursor,
    },

    ".cm-cursor, .cm-dropCursor": { borderLeftColor: cursor },
    "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
      { backgroundColor: editorSelectionHighlightBackground },

    ".cm-panels": { backgroundColor: background, color: textForeground },
    ".cm-panels.cm-panels-top": { borderBottom: "2px solid black" },
    ".cm-panels.cm-panels-bottom": { borderTop: "2px solid black" },

    ".cm-searchMatch": {
      backgroundColor: editorFindMatchBackground,
      outline: "1px solid #457dff",
    },
    ".cm-searchMatch.cm-searchMatch-selected": {
      backgroundColor: "#6199ff2f",
    },

    ".cm-activeLine": { backgroundColor: "#6699ff0b" },
    ".cm-selectionMatch": { backgroundColor: "#aafe661a" },

    "&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket": {
      backgroundColor: "#bad0f847",
    },

    ".cm-gutters": {
      backgroundColor: background,
      color: lineNumberForeground,
      border: "none",
    },

    ".cm-activeLineGutter": {
      color: lineNumberActiveForeground,
    },

    ".cm-foldPlaceholder": {
      backgroundColor: "transparent",
      border: "none",
      color: "#ddd",
    },

    ".cm-tooltip": {
      border: `1px solid`,
      borderColor: tooltipBorderColor,
      backgroundColor: tooltipBackground,
    },
    ".cm-tooltip .cm-tooltip-arrow:before": {
      borderTopColor: "transparent",
      borderBottomColor: "transparent",
    },
    ".cm-tooltip .cm-tooltip-arrow:after": {
      borderTopColor: tooltipBackground,
      borderBottomColor: tooltipBackground,
    },
    ".cm-tooltip-autocomplete": {
      "& > ul > li[aria-selected]": {
        backgroundColor: highlightBackground,
        color: textForeground,
      },
    },
  },
  { dark: true }
);

/// The highlighting style for code displayed in the editor
export const darkModernHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: violet },
  { tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName], color: coral },
  { tag: [t.function(t.variableName), t.labelName], color: malibu },
  { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: whiskey },
  { tag: [t.definition(t.name), t.separator], color: textForeground },
  { tag: [t.typeName, t.className, t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: chalky },
  { tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link, t.special(t.string)], color: cyan },
  { tag: [t.meta, t.comment], color: stone },
  { tag: t.strong, fontWeight: "bold" },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.strikethrough, textDecoration: "line-through" },
  { tag: t.link, color: stone, textDecoration: "underline" },
  { tag: t.heading, fontWeight: "bold", color: coral },
  { tag: [t.atom, t.bool, t.special(t.variableName)], color: whiskey },
  { tag: [t.processingInstruction, t.string, t.inserted], color: sage },
  { tag: t.invalid, color: invalid },
]);

/// Extension to enable the theme (both the editor theme and
/// the highlight style).
export const darkModern: Extension = [darkModernTheme, syntaxHighlighting(darkModernHighlightStyle)];
