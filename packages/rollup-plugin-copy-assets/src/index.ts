import type { Plugin, PluginContext } from "rollup";
import { normalizePath } from "@rollup/pluginutils";
import path, { basename, dirname, join, resolve } from "node:path";
import { readdirSync, readFileSync } from "node:fs";
import process from "node:process";
import { readFile, stat } from "node:fs/promises";
import type { BootConfig, ResourceMap } from "./boot";
import emitPossibleBugWarning from "./emit";
import validateBootConfig from "./validateBootConfig";

interface WasmSharpRollupPluginCopyAssetsOptions {
  assetsPath?: string;
}

function ensureSupportedNodeVersion() {
  return true;
}

const copyAssetsPlugin = (options?: WasmSharpRollupPluginCopyAssetsOptions): Plugin => {
  let basePath: string | undefined;

  return {
    name: "wasm-sharp-rollup-plugin-copy-assets",
    resolveId: {
      order: "pre",
      async handler(source, importer, options) {
        if (source.startsWith(".") && source.endsWith("dotnet.js") && importer) {
          this.info({
            message: `Resolving asset: ${source} from importer: ${importer} options: ${options.isEntry}`,
            pluginCode: "RESOLVE_ASSET",
          });
          basePath = dirname(importer);
        }
        return null;
      },
    },
    async generateBundle(outputOptions) {
      ensureSupportedNodeVersion();

      const outputDir =
        outputOptions.dir || (outputOptions.file && path.dirname(outputOptions.file));
      if (!outputDir) {
        this.error({
          message: "No output directory specified for copying assets.",
          pluginCode: "FIND_OUTPUT_DIR",
        });
      }

      if (!basePath) {
        emitPossibleBugWarning(
          this,
          `Base path not found. Skipping copying of assets.`,
          "FIND_OUTPUT_DIR",
        );
        return;
      }

      const dotnetBootPath = resolve(basePath, "dotnet.boot.json");
      try {
        await stat(dotnetBootPath);
      } catch (err) {
        emitPossibleBugWarning(
          this,
          `dotnet.boot.js not found. Skipping copying of assets.\n${err}\n\n`,
          "RESOLVE_BOOT_CONFIG",
        );
        return;
      }

      const dotnetBootContents = await readFile(dotnetBootPath, { encoding: "utf8" });
      const bootConfig = JSON.parse(dotnetBootContents) as DeepPartial<BootConfig>;
      if (!validateBootConfig(this, bootConfig)) {
        emitPossibleBugWarning(this, `Boot config validation failed.`, "RESOLVE_BOOT_CONFIG", {
          disableBugMessage: true,
        });
        return;
      }

      const files = [
        ...Object.keys(bootConfig.resources.jsModuleNative),
        ...Object.keys(bootConfig.resources.jsModuleRuntime),
        ...Object.keys(bootConfig.resources.wasmNative),
        ...Object.keys(bootConfig.resources.icu),
        ...Object.keys(bootConfig.resources.coreAssembly),
        ...Object.keys(bootConfig.resources.assembly),
        ...Object.entries(bootConfig.resources.satelliteResources).flatMap(([folder, value]) =>
          Object.keys(value).map((key) => join(folder, key)),
        ),
        ...Object.values(bootConfig.resources.coreVfs).flatMap((value) => Object.keys(value)),
      ];

      this.debug({
        message: `Found ${files.length} assets to copy from ${dotnetBootPath}`,
        pluginCode: "COPY_ASSETS",
      });
      if (files.length > 250) {
        //
        //   (1) Check that the path to WasmSharp assets is correct
        //   (2) Ensure the core package has been built with trimming enabled. A normal build (e.g `dotnet build`)
        //       will not enable trimming, instead a publish must be used. A large number of assets may signify
        //       that the assets were created without trimming enabled.
        //   (3) If the number is correct, then this threshold probably needs tweaking.
        emitPossibleBugWarning(this, "More files than expected found when copying.", "COPY_ASSETS");
      }

      const promises = [];
      for (const filePath of files) {
        promises.push(
          (async () => {
            try {
              const file = resolve(basePath, filePath);
              const buffer = await readFile(file);
              this.emitFile({
                type: "asset",
                fileName: filePath,
                source: buffer,
              });
            } catch (err) {
              this.warn({
                message: `Error reading file ${filePath} at path ${join(basePath, filePath)}. \n${err}`,
                pluginCode: "COPY_ASSETS",
              });
            }
          })(),
        );
      }

      const results = await Promise.allSettled(promises);
      if (results.some((p) => p.status === "rejected")) {
        this.warn({
          message: `Some asset files could not be read.`,
          pluginCode: "COPY_ASSETS",
        });
      }
    },
  };
};

export default copyAssetsPlugin;
