## Development setup

This project uses pnpm. Installation instructions for pnpm can be found [here](https://pnpm.io/installation).

### Install packages

```
pnpm
```

### Run the playground

```
pnpm start
```

### Run `tsc watch` for wasm/core

```
pnpm core
```

Don't forget to build the C# project (to copy over the newly built files in the /dist folder to the C# AppBundle) and restart vite + refresh the browser cache after making a change to `@wasmsharp/core`.

### Run tests

```
pnpm test
```

## Deploying the Playground

### publish the Core project:

```
cd /packages/core/src/WasmSharp.Core && dotnet publish -c Release /p:PackOutputDir=<tarball package output dir>
```

This automatically generates a tarball at the location specified by `PackOutputDir`. If not specified, it defaults to "bin/{Configuration}/.net8.0/browser-wasm/AppBundle".

### install the tarball package in the playground:

```
pnpm --filter playground remove @wasmsharp/core
pnpm --filter playground add <tarball package output dir>
```
This will update the @wasmsharp/core reference inside the package.json file to point directly to the tarball using `file:...`. Once the build is complete, this should be reset to "workspace:*", otherwise new changes made to @wasmsharp/core during development will be ignored.

### Build the playground
```
pnpm --filter playground build
```
