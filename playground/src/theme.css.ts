import {
  CSSProperties,
  ComplexStyleRule,
  assignVars,
  createGlobalTheme,
  createGlobalThemeContract,
  createTheme,
  createThemeContract,
  createVar,
  style,
} from "@vanilla-extract/css";
import c from "tinycolor2";

const constants = {
  spacing: 8,
};

export const setSpacing = (spacing: number) => {
  constants.spacing = spacing;
};

export const spacing = (m1: number, m2?: number, m3?: number, m4?: number) => {
  const { spacing } = constants;
  if (m2 === undefined && m3 === undefined && m4 === undefined) {
    return m1 * spacing;
  } else if (m2 !== undefined && m3 === undefined && m4 === undefined) {
    return `${m1 * spacing}px ${m2 * spacing}px`;
  } else if (m3 === undefined || m4 === undefined) {
    throw new TypeError("1, 2 or 4 parameter values must be specified.");
  } else {
    return `${m1 * spacing}px ${m2! * spacing}px ${m3! * spacing}px ${m4! * spacing}px`;
  }
};

const black = c("black");
const white = c("white");

type Color = CSSProperties["color"]

interface Palette {
  primary: Color
  primaryMuted: Color
  text: {
    body: Color
    muted: Color
  };
  accent: Color
  background: {
    main: Color
    container: Color
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
  [K in keyof T]: T[K] extends {} ? MapAsString<T[K]> : string
}

const darkPalette: Palette = {
  primary: "#2D43E6",
  primaryMuted: "#2154AC",
  accent: "#9A2CE6",
  text: {
    body: white.darken(5).toString(),
    muted: white.darken(10).toString(),
  },
  background: {
    main: black.lighten(10).toString(),
    container: black.lighten(15).toString(),
  },
};

const lightPalette: Palette = {
  //TOOD: Write the light mode colors
  primary: "#00",
  primaryMuted: "#'00",
  accent: "#00",
  text: {
    body: black.lighten(5).toString(),
    muted: black.lighten(10).toString()
  },
  background: {
    main: white.darken(10).toString(),
    container: white.darken(15).toString()
  }
}

const paletteVars = createGlobalTheme(":root", darkPalette as MapAsString<typeof darkPalette>);
const darkClass = createTheme(paletteVars, darkPalette as MapAsString<typeof darkPalette>);


// const paletteVars = createGlobalThemeContract(darkPalette as MapAsString<typeof darkPalette>)
// const darkClass = createTheme(darkPalette as MapAsString<typeof darkPalette>)


export const lightClass = createTheme(paletteVars, lightPalette as MapAsString<typeof lightPalette>)
export const palette = paletteVars as unknown as Readonly<Palette>;
export const dark = darkClass;
export const light = lightClass;




