import { style } from "@vanilla-extract/css";
import { spacing } from "../themeUtils";

export const runButton = style({
  marginTop: spacing(2),
  padding: spacing(1),
  display: "flex",
  alignItems: "center",
});

export const outputContainer = style({
  margin: spacing(1, 0),
});

export const container = style({
  margin: spacing(2, 0, 0, 2),
});
