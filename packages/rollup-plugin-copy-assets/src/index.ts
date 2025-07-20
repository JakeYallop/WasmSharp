import type { Plugin, PluginContext } from "rollup";
import { normalizePath } from "@rollup/pluginutils";
import path, { basename, dirname, join, resolve } from "node:path";
import { readdirSync, readFileSync } from "node:fs";
import process from "node:process";
import { readFile, stat } from "node:fs/promises";
import type { BootConfig, ResourceMap } from "./boot";

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

interface WasmSharpRollupPluginCopyAssetsOptions {
  assetsPath?: string;
}

const GithubRepoUrl = "https://www.github.com/JakeYallop/WasmSharp";

function ensureSupportedNodeVersion() {
  return true;
}

const emitPossibleBugWarning = (
  context: PluginContext,
  message: string,
  options?: { disableBugMessage: boolean },
) => {
  if (!options?.disableBugMessage) {
    context.warn(
      `${message} This is probably a bug.${message.endsWith("\n") ? "" : " "}Please report it at ${GithubRepoUrl}.`,
    );
  } else {
    context.warn(message);
  }
};

const validateBootConfig = (
  context: PluginContext,
  bootConfig: DeepPartial<BootConfig>,
): bootConfig is BootConfig => {
  const validateResourceMap = (name: string, resourceMap: Partial<ResourceMap>) => {
    for (const value of Object.values(resourceMap)) {
      if (typeof value !== "string") {
        emitPossibleBugWarning(
          context,
          `Boot config resource ${name} is an expected format. Skipping copying of assets.`,
        );
        return false;
      }
    }
    return true;
  };

  if (!bootConfig.mainAssemblyName || !bootConfig.resources) {
    emitPossibleBugWarning(
      context,
      `Boot config is missing mainAssemblyName or resources. Skipping copying of assets.`,
    );
    return false;
  }

  for (const element of [
    "jsModuleNative",
    "jsModuleRuntime",
    "wasmNative",
    "icu",
    "coreAssembly",
    "assembly",
    "satelliteResources",
    "coreVfs",
  ] as const) {
    if (!bootConfig.resources![element] || typeof bootConfig.resources![element] !== "object") {
      emitPossibleBugWarning(
        context,
        `Boot config is missing resource: ${element}. Skipping copying of assets.`,
      );
      return false;
    }

    if (element !== "coreVfs" && element !== "satelliteResources") {
      if (!validateResourceMap(element, bootConfig.resources![element]!)) {
        return false;
      }
    }
  }

  if (
    !bootConfig.resources!.coreVfs!["runtimeconfig.bin"] ||
    typeof bootConfig.resources!.coreVfs!["runtimeconfig.bin"] !== "object"
  ) {
    emitPossibleBugWarning(
      context,
      `Boot config is missing coreVfs["runtimeconfig.bin"]. Skipping copying of assets.`,
    );
    return false;
  }

  for (const value of Object.values(bootConfig.resources!.satelliteResources!)) {
    if (typeof value !== "object") {
      emitPossibleBugWarning(
        context,
        `Boot config satellite resource ${value} is missing values. Skipping copying of assets.`,
      );
      return false;
    }
  }

  return true;
};

const copyAssetsPlugin = (options?: WasmSharpRollupPluginCopyAssetsOptions): Plugin => {
  let basePath: string | undefined;

  return {
    name: "wasm-sharp-rollup-plugin-copy-assets",
    resolveId: {
      order: "pre",
      async handler(source, importer, options) {
        if (source.startsWith(".") && source.endsWith("dotnet.js") && importer) {
          this.info(
            `Resolving asset: ${source} from importer: ${importer} options: ${options.isEntry}`,
          );
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
        this.error("No output directory specified for copying assets.");
      }

      if (!basePath) {
        emitPossibleBugWarning(this, `Base path not found. Skipping copying of assets.`);
        return;
      }

      const dotnetBootPath = resolve(basePath, "dotnet.boot.json");
      try {
        await stat(dotnetBootPath);
      } catch (err) {
        emitPossibleBugWarning(
          this,
          `dotnet.boot.js not found. Skipping copying of assets.\n${err}\n\n`,
        );
        return;
      }

      const dotnetBootContents = await readFile(dotnetBootPath, { encoding: "utf8" });
      const bootConfig = JSON.parse(dotnetBootContents) as DeepPartial<BootConfig>;
      if (!validateBootConfig(this, bootConfig)) {
        emitPossibleBugWarning(this, `Boot config validation failed.`, { disableBugMessage: true });
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

      this.debug(`Found ${files.length} assets to copy from ${dotnetBootPath}`);
      if (files.length > 250) {
        //
        //   (1) Check that the path to WasmSharp assets is correct
        //   (2) Ensure the core package has been built with trimming enabled. A normal build (e.g `dotnet build`)
        //       will not enable trimming, instead a publish must be used. A large number of assets may signify
        //       that the assets were created without trimming enabled.
        //   (3) If the number is correct, then this threshold probably needs tweaking.
        emitPossibleBugWarning(this, "More files than expected found when copying.");
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
              this.warn(
                `Error reading file ${filePath} at path ${join(basePath, filePath)}. \n${err}`,
              );
            }
          })(),
        );
      }

      const results = await Promise.allSettled(promises);
      if (results.some((p) => p.status === "rejected")) {
        this.warn(`Some asset files could not be read.`);
      }
    },
  };
};

export default copyAssetsPlugin;
