import { style } from "@vanilla-extract/css";

const separator = style({});

export const horizontalSeparator = style([
  separator,
  {
    width: "10px",
    height: "100%",
    cursor: "col-resize",
  },
]);

export const verticalSeparator = style([
  separator,
  {
    width: "100%",
    height: "10px",
    cursor: "row-resize",
  },
]);

export const twoPaneViewContainer = style({
  display: "flex",
  height: "100%",
});
