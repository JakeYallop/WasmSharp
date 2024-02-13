import { test, expect } from "@playwright/experimental-ct-solid";
import App from "../src/App";

test.use({ viewport: { width: 500, height: 500 } });

test("should attach a component", async ({ mount }) => {
  const component = await mount(<App />);
  await expect(component).toBeAttached();
});
