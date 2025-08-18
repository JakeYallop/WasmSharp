<h2 align='center'><samp>@wasmsharp/vite-plugin</samp></h2>

<p align='center'>A plugin for using <a href="https://github.com/JakeYallop/WasmSharp#getting-started">WasmSharp</a> with Vite</p>

- Configures asset handling for WasmSharp runtime files
- Avoids pre-bundling of WasmSharp internals that should load at runtime
- Suppresses large dynamic import warnings from the .NET runtime loader during development, as they cannot be analysed by vite at compile time


## Requirements

- Vite ^6.0.0 (peer dependency)
- If you’re using WasmSharp itself at runtime: `@wasmsharp/core`

## Install

```bash
# plugin (dev dependency)
npm i -D @wasmsharp/vite-plugin
# or
yarn add -D @wasmsharp/vite-plugin
# or
pnpm add -D @wasmsharp/vite-plugin
```

## Quick start

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import wasmSharp from '@wasmsharp/vite-plugin';

export default defineConfig({
  plugins: [wasmSharp()],
});
```

## Options

This plugin currently has no user-configurable options. It provides a minimal Vite configuration to ensure WasmSharp works out of the box.
