
<h2 align='center'><samp>Vite Ignore Dynamic Imports Plugin</samp></h2>

<p align='center'>Automatically suppress warnings for dynamic imports from Vite</p>

## Why?

When working with dynamic imports in Vite, you sometimes want certain imports to be ignored by Vite's built-in `vite:import-analysis` plugin.

Instead of manually adding `/* @vite-ignore */` comments to every dynamic import, this plugin automatically detects and transforms them for you. This is also useful if those warnings come from external packages or processes and files that cannot be edited easily.

## Installation

```bash
npm install vite-plugin-ignore-dynamic-imports
# or
pnpm add vite-plugin-ignore-dynamic-imports
# or
yarn add vite-plugin-ignore-dynamic-imports
```

## Usage

Add the plugin to your `vite.config.js` or `vite.config.ts`:

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import ignoreDynamicImports from 'vite-plugin-ignore-dynamic-imports'

export default defineConfig({
  plugins: [
    ignoreDynamicImports({
      include: ['**/fileWithDynamicImport.js']
    })
  ]
})
```

## Configuration

### Options

- `include` (optional): Array of glob patterns to specify which files should be processed by the plugin. If not provided, no files will be processed.

### How it works

The plugin transforms dynamic imports like so:

```typescript
// Before transformation
const module = await import('./some-module.js')

// After transformation
const module = await import(/* @vite-ignore */'./some-module.js')
```

The plugin uses `unplugin-ast` to walk the syntax tree of the specified files, detects dynamic import expressions (`import()` statements), and automatically adds the `/* @vite-ignore */` comment to prevent Vite's import analysis from processing them.

## Development

For development and debugging, you can use [AST Explorer](https://astexplorer.net/) to visualize the syntax tree transformations.
