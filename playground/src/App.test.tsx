import { describe, it, expect } from "vitest";
import { render } from "@solidjs/testing-library";
import App from "./App";

describe("App", () => {
  it("should render", () => {
    render(() => <App />);
  });
});
