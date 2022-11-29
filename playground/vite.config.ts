import { defineConfig } from "vitest/config";
import solidPlugin from "vite-plugin-solid";
import ignoreDynamicImports from "vite-plugin-ignore-dynamic-imports";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";

export default defineConfig(({ mode }) => {
  /**
   * @type {}
   */
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
    test: {
      deps: {
        inline: [
          //https://github.com/solidjs/solid-testing-library/issues/10
          "@solidjs/testing-library",
          /\@solidjs\/testing-library/,
          /solid-testing-library/,
        ],
      },
      environment: "happy-dom",
      //https://vitest.dev/config/#transformmode
      transformMode: {
        web: [/\.[jt]sx$/],
      },
    },
  };
});
