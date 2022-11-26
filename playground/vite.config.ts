import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import ignoreDynamicImports from "vite-plugin-ignore-dynamic-imports";

export default defineConfig({
  plugins: [
    solidPlugin(),
    ignoreDynamicImports({
      include: ["**/dotnet.js"],
    }),
  ],
  server: {
    fs: {
      strict: false,
    },
    port: 3000,
  },
  build: {
    target: "esnext",
  },
});
