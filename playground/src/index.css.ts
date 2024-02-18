import { globalStyle } from "@vanilla-extract/css";
import { palette } from "./theme.css";
import c from "tinycolor2";

globalStyle("#root", {
  backgroundColor: palette.background.main,
  height: "100%",
  width: "100%",
  display: "flex",
  flexDirection: "column",
});

globalStyle("html, body", {
  height: "100%",
  width: "100%",
  fontFamily: "Segoe UI,Helvetica Neue,sans-serif;",
  color: palette.text.body,
});

const background = c(palette.background.main as string);

globalStyle("body", {
  scrollbarColor: `${background.lighten(65).toString()} ${palette.background.container}`,
  scrollbarWidth: "thin",
});
