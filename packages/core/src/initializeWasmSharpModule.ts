import { dotnet as dotnetHostBuilder, type MonoConfig, type DotnetModuleConfig, DotnetHostBuilder } from "./dotnet.js";
import type { WasmSharpModuleOptions, AssemblyExports, WasmSharpModuleCallbacks } from "./WasmCompiler.js";
import blazorBootJson from "./blazor.boot.json" assert { type: "json" };

function getDirectory(path: string) {
  var index = path.lastIndexOf("/");
  if (index !== -1) {
    return path.substring(0, index + 1);
  } else {
    return path;
  }
}

export async function initializeWasmSharpModule(
  options: WasmSharpModuleOptions | undefined,
  callbacks: WasmSharpModuleCallbacks | undefined
) {
  type InternalsHostBuilder = DotnetHostBuilder & {
    //internal method: https://github.com/dotnet/runtime/blob/a270140281a13ab82a4401dff3da6d27fe499087/src/mono/wasm/runtime/loader/run.ts#L26
    withModuleConfig(config: DotnetModuleConfig): InternalsHostBuilder;
  };
  const hostBuilder: InternalsHostBuilder = dotnetHostBuilder as InternalsHostBuilder;

  let resourcesToLoad = 0;
  const { getAssemblyExports, getConfig } = await hostBuilder
    .withModuleConfig({
      onConfigLoaded(config: MonoConfig) {
        resourcesToLoad = Object.keys(config.resources?.assembly ?? {}).length;
        resourcesToLoad += Object.keys(config.resources?.pdb ?? {}).length;
        resourcesToLoad += Object.keys(config.resources?.icu ?? {}).length;
        //we are off by one when using the above - maybe its the wasm module, maybe its something else. Either way, this resolves the issue for now
        resourcesToLoad += 1;
        callbacks?.onConfigLoaded?.(config);
      },
      onDownloadResourceProgress(loaded: number, total: number) {
        callbacks?.onDownloadResourceProgress?.(loaded, resourcesToLoad);
      },
      config: blazorBootJson,
    })
    .withDiagnosticTracing(options?.enableDiagnosticTracing ?? false)
    //workaround https://github.com/dotnet/runtime/issues/94238
    //.withDebugging(options?.debugLevel ?? 1)
    .withConfig({
      debugLevel: options?.debugLevel ?? 0,
    })
    .create();

  const config = getConfig();
  const assemblyExports: AssemblyExports = await getAssemblyExports(config.mainAssemblyName!);
  const compilationInterop = assemblyExports.WasmSharp.Core.CompilationInterop;
  //TODO: Handle nested assets folder (WasmRuntimeAssetsLocation)z
  //TODO: Rewrite this to use new URL()
  const resolvedAssembliesUrl = options?.assembliesUrl ?? getDirectory(import.meta.url);
  console.log(`Initialising assembly context from url: ${resolvedAssembliesUrl}`);
  const time = performance.now();
  await compilationInterop.InitAsync(resolvedAssembliesUrl, JSON.stringify(config));
  const diff = performance.now() - time;
  console.log(`Finished initialising assembly context in ${diff}ms`);
  return compilationInterop;
}
