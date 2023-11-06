import { style } from "@vanilla-extract/css";
import { spacing } from "../themeUtils";

export const runButton = style({
  margin: spacing(3),
  padding: spacing(1),
  display: "flex",
  alignItems: "center",
});

export const outputContainer = style({
  margin: spacing(2, 3),
});
