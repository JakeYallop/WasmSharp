import { style } from "@vanilla-extract/css";
import { palette } from "../theme.css.js";
import { spacing } from "../themeUtils.js";

export const container = style({
  width: "100%",
  backgroundColor: palette.background.container,
});

//generate css for a circular progress indicator, th progress should increase based on the width of the container, and respect prefers-less-motion

export const progressBar = style({
  transition: "width 0.5s ease-in-out",
  height: spacing(0.4),
  backgroundColor: palette.accent,
});
