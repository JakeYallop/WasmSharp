import { style } from "@vanilla-extract/css";
import {  palette, spacing } from "../theme.css.js";

export const container = style({
  width: "100%",
  padding: `${spacing(0.5)}`,
  backgroundColor: palette.background.container
});

//generate css for a circular progress indicator, th progress should increase based on the width of the container, and respect prefers-less-motion

export const progressBar = style({
  transition: "width 0.5s ease-in-out",
  height: spacing(0.25),
  backgroundColor: palette.accent
});

