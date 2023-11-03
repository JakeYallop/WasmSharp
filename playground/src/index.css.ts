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

//TODO: Move to own file
globalStyle(".cm-editor", {
  fontFamily: 'monaco,Consolas,"Lucida Console",monospace',
});

globalStyle(".cm-editor .cm-gutters", {
  //TODO: use variable instead - otherwise this will not change when the color theme is changed
  backgroundColor: c(palette.background.container as string)
    .lighten(30)
    .toString(),
  color: palette.text.body,
});

globalStyle(".cm-editor .cm-activeLineGutter", {
  backgroundColor: c(palette.background.container as string)
    .lighten(40)
    .toString(),
});
