/// <reference types="vitest" />
import { defineConfig } from "vite";
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
    worker: {
      format: "es",
    },
    test: {
      environment: "node",
    },
  };
});

function atLeastMinimumVersion(currentVersion: string, minimumVersion: string) {
  return compareVersions(currentVersion, minimumVersion) >= 0;
}

function wasmSharpPlugin(): Plugin {
  let config: ResolvedConfig;
  let logger: Logger;
  const additionalFilesToCopy: { src: string; dest: string }[] = [];

  const writeCopyProgress = (copied: number, files: fs.Dirent[]) => {
    config!.logger.info(`Copied ${copied}/${files.length} files`);
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
      logger = config.logger;
    },
    async generateBundle(output) {
      const logger = config.logger;

      ensureSupportedNodeVersion();

      logger.info("\nPreparing to copy @wasmsharp/core assets...");
      const wasmSharpJsonPath = await findDepPkgJsonPath("@wasmsharp/core", output.dir!);
      if (!wasmSharpJsonPath) {
        logger.warn(
          "Could not resolve package information for @wasmsharp/core, the build may not have completed successfully."
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

//Fixes an issue where vite resolves the package.json at the package level, but dotnet.js only exists in the output directory
const wasmSharpRewriteImportsForWorkspace = (): Plugin => {
  const resolvePath = () => {
    const cwd = process.cwd();
    const debugPath = path.join(cwd, "../packages/core/src/bin/Debug/net8.0/browser-wasm/AppBundle");
    const releasePath = path.join(cwd, "../packages/core/src/bin/Release/net8.0/browser-wasm/AppBundle");

    if (fs.existsSync(releasePath)) {
      return releasePath;
    }

    if (fs.existsSync(debugPath)) {
      return debugPath;
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
