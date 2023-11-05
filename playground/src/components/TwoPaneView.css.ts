import { style } from "@vanilla-extract/css";
import { px } from "../themeUtils";

const separatorWidth = 10;
const separator = style({
  zIndex: 1,
  marginLeft: px(-(separatorWidth / 2)),
});

export const horizontalSeparator = style([
  separator,
  {
    width: px(separatorWidth),
    height: "100%",
    cursor: "col-resize",
  },
]);

export const verticalSeparator = style([
  separator,
  {
    width: "100%",
    height: px(separatorWidth),
    cursor: "row-resize",
  },
]);

export const twoPaneViewContainer = style({
  display: "flex",
  height: "100%",
});
