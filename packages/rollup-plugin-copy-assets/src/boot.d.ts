type ResourceMap = {
  [key: string]: string;
};

export interface BootConfig {
  mainAssemblyName: string;
  resources: {
    hash: string;
    jsModuleNative: ResourceMap;
    jsModuleRuntime: ResourceMap;
    wasmNative: ResourceMap;
    wasmSymbols: ResourceMap;
    icu: ResourceMap;
    coreAssembly: ResourceMap;
    assembly: ResourceMap;
    satelliteResources: {
      [lang: string]: ResourceMap;
    };
    coreVfs: {
      [key: string]: ResourceMap;
    };
  };
  debugLevel: number;
  globalizationMode: string;
}