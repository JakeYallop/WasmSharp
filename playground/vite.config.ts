import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import ignoreDynamicImports from "vite-plugin-ignore-dynamic-imports";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";

export default defineConfig(({ mode }) => {
  return {
    plugins: [
      solidPlugin(),
      ignoreDynamicImports({
        include: ["**/dotnet.js"],
      }),
      vanillaExtractPlugin({
        identifiers: mode === "devlopment" ? "debug" : "short",
      }),
    ],
    server: {
      fs: {
        strict: false,
      },
      port: 3000,
    },
    build: {
      target: "esnext",
    },
  };
});
