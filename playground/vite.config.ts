import { defineConfig } from "vitest/config";
import solidPlugin from "vite-plugin-solid";
import ignoreDynamicImports from "vite-plugin-ignore-dynamic-imports";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import inspect from "vite-plugin-inspect";

export default defineConfig(({ mode }) => {
  return {
    plugins: [
      inspect({
        open: false,
      }),
      solidPlugin(),
      ignoreDynamicImports({
        include: ["**/dotnet.runtime.js", "**/dotnet.js"],
      }),
      vanillaExtractPlugin({
        identifiers: mode === "devlopment" ? "debug" : "short",
      }),
    ],

    server: {
      fs: {
        strict: false,
      },
      open: true,
      port: 3000,
    },
    build: {
      target: "esnext",
    },
    optimizeDeps: {
      exclude: ["dotnet.js"],
    },
    resolve: {
      //https://github.com/solidjs/solid-testing-library/issues/30
      conditions: ["browser"],
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
