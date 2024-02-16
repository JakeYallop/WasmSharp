import { CSSProperties, createGlobalTheme, createThemeContract } from "@vanilla-extract/css";
import c from "tinycolor2";

const black = c("black");
const white = c("white");

type Color = CSSProperties["color"];

interface Palette {
  primary: Color;
  primaryMuted: Color;
  text: {
    body: Color;
    muted: Color;
  };
  accent: Color;
  background: {
    main: Color;
    container: Color;
  };
}

export const themeVars = createThemeContract({
  primary: "",
  primaryMuted: "",
  accent: "",
  text: {
    body: "",
    muted: "",
  },
  background: {
    main: "",
    container: "",
  },
});

type MapAsString<T extends {}> = {
  [K in keyof T]: T[K] extends {} ? MapAsString<T[K]> : string;
};

const darkPalette: Palette = {
  primary: "#2D43E6",
  primaryMuted: "#2154AC",
  accent: "#9A2CE6",
  text: {
    body: white.darken(15).toString(),
    muted: white.darken(22).toString(),
  },
  background: {
    main: black.lighten(10).toString(),
    container: black.lighten(15).toString(),
  },
};

const lightPalette: Palette = {
  //TOOD: Write the light mode colors
  primary: "#00",
  primaryMuted: "#00",
  accent: "#00",
  text: {
    body: black.lighten(5).toString(),
    muted: black.lighten(10).toString(),
  },
  background: {
    main: white.darken(10).toString(),
    container: white.darken(15).toString(),
  },
};

const paletteVars = createGlobalTheme(":root", darkPalette as MapAsString<typeof darkPalette>);
createGlobalTheme(".dark", darkPalette as MapAsString<typeof darkPalette>);
createGlobalTheme(".light", paletteVars, lightPalette as MapAsString<typeof lightPalette>);
export const palette = paletteVars as unknown as Readonly<Palette>;
