import { globalStyle } from "@vanilla-extract/css";
import { palette } from "../theme.css";
import c from "tinycolor2";

globalStyle(".cm-editor", {
  fontFamily: 'monaco,Consolas,"Lucida Console",monospace',
  height: "100%",
  fontSize: "110%",
});
