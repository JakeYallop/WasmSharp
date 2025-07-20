import type { PluginContext } from "rollup";
import type { BootConfig, ResourceMap } from "./boot";
import emitPossibleBugWarning from "./emit";

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
          "RESOLVE_BOOT_CONFIG",
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
      "RESOLVE_BOOT_CONFIG",
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
        "RESOLVE_BOOT_CONFIG",
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
      "RESOLVE_BOOT_CONFIG",
    );
    return false;
  }

  for (const value of Object.values(bootConfig.resources!.satelliteResources!)) {
    if (typeof value !== "object") {
      emitPossibleBugWarning(
        context,
        `Boot config satellite resource ${value} is missing values. Skipping copying of assets.`,
        "RESOLVE_BOOT_CONFIG",
      );
      return false;
    }
  }

  return true;
};

export default validateBootConfig;
