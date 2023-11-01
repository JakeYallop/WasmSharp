import { globalStyle } from "@vanilla-extract/css";
import { palette } from "./theme.css";

globalStyle("#root", {
  backgroundColor: palette.background.main,
  height: "100%",
  width: "100%",
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
