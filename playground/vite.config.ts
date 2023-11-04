import { defineConfig } from "vitest/config";
import solidPlugin from "vite-plugin-solid";
import ignoreDynamicImports from "vite-plugin-ignore-dynamic-imports";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import inspect from "vite-plugin-inspect";
import { Plugin, ResolvedConfig, ViteDevServer, normalizePath, resolvePackageData, resolvePackageEntry } from "vite";
import path from "path";
import fs from "fs";

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
      wasmSharpPlugin(),
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

function wasmSharpPlugin(): Plugin {
  let config: ResolvedConfig;
  return {
    name: "vite-plugin-wasm-sharp-assets-include",
    config() {
      return {
        optimizeDeps: {
          //TODO: figure out exactly why this works
          exclude: ["@wasmsharp/core"],
        },
      };
    },
    configResolved(resolved) {
      config = resolved;
    },
    generateBundle(output) {
      const data = resolvePackageData("@wasmsharp/core", output.dir!, true);
      if (!data) {
        return;
      }
      const files = fs.readdirSync(data!.dir, { withFileTypes: true, recursive: true }).filter((x) => {
        const ext = path.extname(x.name);
        if (
          ext === ".ts" ||
          (ext === ".js" && x.name !== "dotnet.native.js" && x.name !== "dotnet.runtime.js") ||
          ext === ".pdb" ||
          ext === ".html" ||
          ext === ".symbols" ||
          x.isDirectory()
        ) {
          return false;
        }

        return true;
      });

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const normalizedPath = normalizePath(file.path);
        const wasmSharpSplitString = "@wasmsharp/core";
        const parts = normalizedPath.split(wasmSharpSplitString);
        let finalPath: string;
        if (parts[1] === undefined) {
          finalPath = "";
        } else {
          finalPath = parts[1].substring(1, parts[1].length);
        }

        const fileName = path.join(finalPath, file.name);
        const buffer = fs.readFileSync(path.join(file.path, file.name));
        const source = new Uint8Array(buffer.buffer);
        this.emitFile({
          type: "asset",
          needsCodeReference: false,
          fileName: path.join(config.build.assetsDir, fileName),
          source: source,
        });
      }
    },
  };
}
