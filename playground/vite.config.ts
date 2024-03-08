/// <reference types="vitest" />
import { createLogger, defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import ignoreDynamicImports from "vite-plugin-ignore-dynamic-imports";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import inspect from "vite-plugin-inspect";
import { Logger, Plugin, ResolvedConfig, normalizePath } from "vite";
import path from "path";
import fs from "fs";
import { findDepPkgJsonPath } from "vitefu";
import { compareVersions } from "compare-versions";
import basicSsl from "@vitejs/plugin-basic-ssl";
import postCssNesting from "postcss-nesting";
//@ts-expect-error
import postCssScrollbar from "postcss-scrollbar";

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
      wasmSharpPlugin({
        assetsPath: resolveInternalMonorepoPath(),
      }),
    ],
    server: {
      fs: {
        strict: false,
      },
      open: true,
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

function atLeastMinimumVersion(currentVersion: string, minimumVersion: string) {
  return compareVersions(currentVersion, minimumVersion) >= 0;
}

interface WasmSharpPluginOptions {
  assetsPath?: string;
}

function wasmSharpPlugin(options?: WasmSharpPluginOptions): Plugin {
  let config: ResolvedConfig;
  const logger = createLogger("info", { allowClearScreen: true });
  const additionalFilesToCopy: { src: string; dest: string }[] = [];

  const writeCopyProgress = (copied: number, files: fs.Dirent[]) => {
    logger.info(`Copied ${copied}/${files.length} files`);
  };

  const ensureSupportedNodeVersion = () => {
    const nodeVersion = process.version.startsWith("v") ? process.version.slice(1) : process.version;
    if (nodeVersion) {
      if (!atLeastMinimumVersion(nodeVersion, "18.7.0") && !atLeastMinimumVersion(nodeVersion, "20.1.0")) {
        throw Error("This plugin requires at least node v18.7.0 or v20.1.0 to execute");
      }
    } else {
      logger.warn("Could not determine node version. Continuing with the build, but there may be errors.");
    }
  };

  return {
    name: "wasm-sharp-include-assets",
    enforce: "post",
    config() {},
    configResolved(resolved) {
      config = resolved;
    },
    async generateBundle(output) {
      ensureSupportedNodeVersion();

      logger.info("\nPreparing to copy @wasmsharp/core assets...");
      let wasmSharpJsonPath = options?.assetsPath;
      if (!wasmSharpJsonPath) {
        wasmSharpJsonPath = await findDepPkgJsonPath("@wasmsharp/core", output.dir!);
      }

      if (!wasmSharpJsonPath || !fs.existsSync(wasmSharpJsonPath)) {
        logger.warn(
          `Could not resolve package information for @wasmsharp/core, the build may not have completed successfully. Search path: '${wasmSharpJsonPath}'`
        );
        return;
      }
      const wasmSharpPath = normalizePath(path.dirname(wasmSharpJsonPath));

      logger.info(`Found @wasmsharp/core assets at ${wasmSharpPath}`);
      logger.info("Copying @wasmsharp/core assets...");

      const files = fs
        .readdirSync(wasmSharpPath, { withFileTypes: true, recursive: true })
        .filter((x) => !x.isDirectory() && !x.path.includes("node_modules"));

      logger.info(`Found ${files.length} assets to copy.`);

      if (files.length > 250) {
        throw new Error(
          "Stopping copy - too many files found, something is probably wrong.\n" +
            "(1) Check that the path to WasmSharm assets is correct \n" +
            "(2) Ensure the core package has been built with trimming enabled. A normal build (e.g `dotnet build`) will not enable trimming, " +
            "instead a publish must be used. A large number of assets may signify that the assets were created without trimming enabled. \n" +
            "If the number is correct, then this threshold probably needs tweaking."
        );
      }

      let intervalStart = Date.now();
      for (let i = 0; i < files.length; i++) {
        if (Date.now() - intervalStart > 500) {
          writeCopyProgress(i, files);
          intervalStart = Date.now();
        }

        const file = files[i];
        const filePath = normalizePath(path.join(file.path, file.name));
        const relativeOutputPath = path.relative(wasmSharpPath, filePath);

        try {
          const buffer = fs.readFileSync(filePath);

          this.emitFile({
            type: "asset",
            needsCodeReference: false,
            fileName: path.join(config.build.assetsDir, relativeOutputPath),
            source: buffer,
          });
        } catch (err) {
          logger.error(`Error reading file ${relativeOutputPath} at path ${filePath}.`);
          throw err;
        }
      }
      writeCopyProgress(files.length, files);
    },
    closeBundle() {
      for (let index = 0; index < additionalFilesToCopy.length; index++) {
        const file = additionalFilesToCopy[index];
        if (!fs.existsSync(path.dirname(file.dest))) {
          fs.mkdirSync(path.dirname(file.dest), { recursive: true });
        }

        fs.copyFileSync(file.src, file.dest);
        logger.info(`Copying additional file ${file.src} to ${file.dest}`);
      }
    },
  };
}

function resolveInternalMonorepoPath(disableErrorOnFailure?: false): string;
function resolveInternalMonorepoPath(disableErrorOnFailure?: boolean): string | undefined {
  const cwd = process.cwd();
  const releasePath = path.join(cwd, "../packages/core/src/bin/Release/net8.0/browser-wasm/AppBundle/WasmCompiler.js");

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
    name: "wasm-sharp-rewrite=dotnet-imports-plugin",
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
