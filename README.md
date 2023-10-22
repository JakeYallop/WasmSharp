# Development setup
This project uses pnpm. Installation instructions for pnpm can be found [here](https://pnpm.io/installation).

## Install packages
```
pnpm
```

## Run the playground
```
pnpm start
```

## Run `tsc watch` for wasm/core
```
pnpm core
```

Don't forget to build the C# project (to copy over the newly built files in the /dist folder to the C# AppBundle) and restart vite + refresh the browser cache after making a change to `@wasmsharp/core`.

## Run tests
```
pnpm test
```

## Known issues
* Currently when building WasmSharp.Core, a package.json is inserted into the build output directory. This will have an incorrect path for `main` of "bin/Debug/.../AppBundle/index.ks". This needs updating to just be index.js.
