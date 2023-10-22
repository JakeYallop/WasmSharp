
<h2 align='center'><samp>Vite Ignore Dynamic Imports Plugin</samp></h2>

<p align='center'>Rewrites <i>dynamic imports</i> to that they are not flagged by the  <code>vite:import-analysis</code> plugin</p>


## Summary

Walks the syntax tree for the affected files (using unplugin-ast), detects dynamic import statements, and rewrites them by adding a `/* vite-ignore */` to the affected import.

## Usage

```javascript
//vite.config.js
import ignoreDynamicImports from "vite-plugin-ignore-dynamic-imports"

export default defineConfig({
  plugins: [
    ignoreDynamicImports({
      include: ["**/fileWithDynamicImport.js"]
    })
  ]
})
```


## Helpful development tools
* https://astexplorer.net/ - unplugin-ast uses @babel/parser
