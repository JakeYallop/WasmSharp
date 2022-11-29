import { describe, expect, it } from "vitest";
import { spacing, setSpacing } from "./theme";

describe("theme tests", () => {
  describe.concurrent("spacing", () => {
    setSpacing(8);
    it.concurrent.each([
      [0.5, 4],
      [1, 8],
      [2, 16],
      [4, 32],
    ])(
      "should return the correct result with 1 argument, arg: %d",
      (arg, expected) => {
        const result = spacing(arg);
        expect(result).toBe(expected);
      }
    );

    it.concurrent.each([
      [1, 1, "8px 8px"],
      [0.5, 1, "4px 8px"],
      [0, 1, "0px 8px"],
      [1, 0, "8px 0px"],
      [0, 2, "0px 16px"],
    ])(
      "should return the correct result with 2 arguments, args: %d, %d",
      (a1, a2, expected) => {
        const result = spacing(a1, a2);
        expect(result).toBe(expected);
      }
    );

    it.concurrent.each([
      [1, 1, 1, 1, "8px 8px 8px 8px"],
      [0.5, 1, 0.5, 1, "4px 8px 4px 8px"],
      [0, 1, 0, 1, "0px 8px 0px 8px"],
      [1, 1, 1, 0, "8px 8px 8px 0px"],
      [0, 0.5, 0.25, 1, "0px 4px 2px 8px"],
    ])(
      "should return the correct result with 4 arguments, args: %d, %d, %d, %d",
      (a1, a2, a3, a4, expected) => {
        const result = spacing(a1, a2, a3, a4);
        expect(result).toBe(expected);
      }
    );

    it("throws a TypeError with 3 args provided", () => {
      expect(() => spacing(1, 2, 3)).toThrow(TypeError);
    });
  });
});
