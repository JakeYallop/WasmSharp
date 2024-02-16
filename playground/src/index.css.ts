import { globalStyle } from "@vanilla-extract/css";
import { palette } from "./theme.css";

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
  fontSize: "110%",
  fontFamily: "Segoe UI,Helvetica Neue,sans-serif;",
  color: palette.text.body,
});
