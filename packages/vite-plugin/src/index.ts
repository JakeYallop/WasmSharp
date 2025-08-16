import type { Plugin } from "vite";

export default function vitePluginWasmSharp(): Plugin {
  return {
    name: "vite-plugin-wasm-sharp",
  };
}

export { vitePluginWasmSharp };
