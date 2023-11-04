import { constants } from "./theme.css";

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

export const px = (value: number) => `${value}px`;
