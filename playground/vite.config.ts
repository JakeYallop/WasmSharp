/// <reference types="vitest" />
import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import ignoreDynamicImports from "vite-plugin-ignore-dynamic-imports";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import inspect from "vite-plugin-inspect";
import type { Plugin } from "vite";
import path from "path";
import fs from "fs";
import basicSsl from "@vitejs/plugin-basic-ssl";
import postCssNesting from "postcss-nesting";
//@ts-expect-error
import postCssScrollbar from "postcss-scrollbar";
import wasmSharpCopyAssets from "@wasmsharp/rollup-plugin";

export default defineConfig(({ mode }) => {
  return {
    plugins: [
      basicSsl(),
      inspect({
        open: false,
      }),
      solidPlugin(),
      ignoreDynamicImports({
        include: ["**/dotnet.runtime.js", "**/dotnet.js"],
      }),
      vanillaExtractPlugin({
        identifiers: mode === "development" ? "debug" : "short",
      }),
      wasmSharpRewriteImportsForWorkspace(),
    ],
    assetsInclude: ["**/*.dll", "**/*.wasm", "**/*.dat"],
    server: {
      fs: {
        strict: false,
      },
      port: 3000,
    },
    css: {
      postcss: {
        plugins: [postCssNesting(), postCssScrollbar()],
      },
    },
    build: {
      target: "esnext",
    },
    worker: {
      format: "es",
    },
    test: {
      environment: "node",
      exclude: ["node_modules", "e2e"],
    },
  };
});

function resolveInternalMonorepoPath(disableErrorOnFailure?: false): string;
function resolveInternalMonorepoPath(disableErrorOnFailure?: boolean): string | undefined {
  const cwd = process.cwd();
  const releasePath = path.join(
    cwd,
    "../packages/core/src/bin/Release/net10.0/publish/wwwroot/_framework/WasmCompiler.js"
  );

  if (fs.existsSync(releasePath)) {
    return releasePath;
  }

  if (fs.existsSync(path.dirname(releasePath))) {
    throw Error(
      "Found AppBundle directory, but could not find WasmCompiler.js - ensure @wasmsharp/core has been built, there may be an issue with the build. Check if there is an incremental build info file created by tsc in the parent directory."
    );
  }

  if (!disableErrorOnFailure) {
    throw Error(
      `Could not find AppBundle directory - ensure @wasmsharp/core has been built!\n Search path: ${releasePath}`
    );
  }
}

//Fixes an issue where vite resolves the package.json at the package level, but dotnet.js only exists in the output directory
const wasmSharpRewriteImportsForWorkspace = (): Plugin => {
  return {
    name: "wasm-sharp-rewrite-dotnet-imports-plugin",
    enforce: "pre",
    config() {
      return {
        resolve: {
          alias: [
            {
              find: "@wasmsharp/core",
              replacement: resolveInternalMonorepoPath(),
            },
          ],
        },
      };
    },
  };
};
