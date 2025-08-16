# @wasmsharp/vite-plugin

A plugin for using WasmSharp with vite.

## Installation

```bash
npm install @wasmsharp/vite-plugin
# or
pnpm add @wasmsharp/vite-plugin
# or
yarn add @wasmsharp/vite-plugin
```

## Usage

```typescript
import { defineConfig } from 'vite';
import wasmSharp from '@wasmsharp/vite-plugin';

export default defineConfig({
  plugins: [wasmSharp()]
});
```
