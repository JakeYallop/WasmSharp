import { test, expect } from "@playwright/experimental-ct-solid";
import App from "../src/App";

test.use({ viewport: { width: 500, height: 500 } });

test("load successfully and initialize WasmSharp", async ({ mount }) => {
  const component = await mount(<App />);
  await expect(component).toBeAttached();
  await expect(component).toContainText("Run");
});
