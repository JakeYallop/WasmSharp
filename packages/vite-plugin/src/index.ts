import type { Plugin, UserConfig } from "vite";
import ignoreDynamicImports from "vite-plugin-ignore-dynamic-imports";

export default function wasmSharpPlugin(): Plugin[] {
  return [
    // prevent large import warnings in development
    ignoreDynamicImports({
      include: ["**/dotnet.runtime.js", "**/dotnet.js"],
    }),

    {
      name: "vite-plugin-wasm-sharp",
      enforce: "pre",

      config(): UserConfig {
        return {
          assetsInclude: ["**/*.dll", "**/*.wasm", "**/*.dat"],
          optimizeDeps: {
            exclude: ["@wasmsharp/core"],
            esbuildOptions: {
              loader: {
                ".dll": "file",
                ".wasm": "file",
                ".dat": "file",
              },
            },
          },
          worker: {
            format: "es",
          },
        };
      },
    },
  ];
}

export { wasmSharpPlugin };
