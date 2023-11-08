import { defineConfig } from "vitest/config";
import solidPlugin from "vite-plugin-solid";
import ignoreDynamicImports from "vite-plugin-ignore-dynamic-imports";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import inspect from "vite-plugin-inspect";
import { Plugin, ResolvedConfig, mergeConfig, normalizePath, resolvePackageData, resolvePackageEntry } from "vite";
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
      wasmSharpRewriteImportsForWorkspace(),
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
  let runtimeConfigOutputPath: string | undefined;
  let runtimeConfigPath: string | undefined;
  return {
    name: "wasm-sharp-include-assets",
    enforce: "post",
    config() {
      return {
        optimizeDeps: {
          //TODO: figure out exactly why this works
          exclude: ["@wasmsharp/core"],
        },
        build: {
          sourcemap: false,
        },
      };
    },
    configResolved(resolved) {
      config = resolved;
    },
    generateBundle(output) {
      console.log("process", process.env);
      config.logger.info("Copying @wasmsharp/core assets...");
      const data = resolvePackageData("@wasmsharp/core", output.dir!);
      console.log(data);
      if (!data) {
        config.logger.warn(
          "Could not resolve package information for @wasmsharp/core, the build may not have completed successfully/"
        );
        return;
      }
      config.logger.info(`Found @wasmsharp/core assets at ${data.dir}`);

      config.logger.info("Copying @wasmsharp/core assets...");
      const files = fs.readdirSync(data!.dir, { withFileTypes: true, recursive: true }).filter((x) => !x.isDirectory());

      config.logger.info(`Found ${files.length} assets to copy`);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const normalizedPath = normalizePath(file.path);
        const wasmSharpSplitString = "@wasmsharp/core";
        const parts = normalizedPath.split(wasmSharpSplitString);
        let nestedDirectory: string;
        if (parts[1] === undefined) {
          nestedDirectory = "";
        } else {
          nestedDirectory = parts[1].substring(1, parts[1].length);
        }

        const filePath = path.join(file.path, file.name);
        const relativeOutputPath = path.join(nestedDirectory, file.name);
        config.logger.info(`Emitting asset from ${filePath} to ${relativeOutputPath}`);
        if (file.name === "0_runtimeconfig.bin" || file.path.includes("supportFiles")) {
          if (file.name !== "0_runtimeconfig.bin") {
            config.logger.error("Extra supportFiles found, check may need updating.");
          }
          //TODO: Open an issue on the rollup github to diagnose this issue so we can remove this warning
          config.logger.warn(
            "Skipping `this.emitFile` call for 0_runtimeconfig.bin as it ends up getting a sourcemap and other info appended even with type: asset. Instead, we copy it manually inside the closeBundle hook after generateBundle has completed."
          );

          runtimeConfigPath = filePath;
          runtimeConfigOutputPath = path.join(config.build.outDir, config.build.assetsDir, relativeOutputPath);
          continue;
        }
        try {
          const buffer = fs.readFileSync(filePath);
          const source = new Uint8Array(buffer.buffer);
          this.emitFile({
            type: "asset",
            needsCodeReference: false,
            fileName: path.join(config.build.assetsDir, relativeOutputPath),
            source: source,
          });
        } catch (err) {
          config.logger.error(`Error reading file ${relativeOutputPath} at path ${filePath}.`);
          throw err;
        }
      }
    },
    closeBundle() {
      if (runtimeConfigPath && runtimeConfigOutputPath) {
        config.logger.info(`Copying 0_runtimeconfig.bin from ${runtimeConfigPath} to ${runtimeConfigOutputPath}`);
        fs.mkdirSync(path.dirname(runtimeConfigOutputPath), { recursive: true });
        fs.copyFileSync(runtimeConfigPath, runtimeConfigOutputPath);
      } else {
        config.logger.warn(
          "Either `runtimeConfigPath` or `runtimeConfigOutputPath` was not defined. Could not copy 0_runtimeconfig.bin."
        );
      }
    },
  };
}

//Fixes an issue where vite resolves the package.json at the package level, but dotnet.js only exists in the output directory
const wasmSharpRewriteImportsForWorkspace = (): Plugin => {
  const resolvePath = () => {
    const cwd = process.cwd();
    const debugPath = path.join(cwd, "../packages/core/src/bin/Debug/net8.0/browser-wasm/AppBundle");
    const releasePath = path.join(cwd, "../packages/core/src/bin/Debug/net8.0/browser-wasm/AppBundle");

    if (fs.existsSync(debugPath)) {
      return debugPath;
    }

    if (fs.existsSync(releasePath)) {
      return releasePath;
    }

    throw Error("Could not find AppBundle directory - ensure @wasmsharp/core has been built!");
  };

  return {
    name: "wasm-sharp-rewrite=dotnet-imports-plugin",
    enforce: "pre",
    config() {
      return {
        resolve: {
          alias: [
            {
              find: "@wasmsharp/core",
              replacement: resolvePath(),
            },
          ],
        },
      };
    },
  };
};
