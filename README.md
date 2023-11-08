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
cd /packages/core && dotnet publish -c Release
```

### Ensure the latest package is referenced in the playground:

```
pnpm --filter playground remove @wasmsharp/core
pnpm --filter playground add @wasmsharp/core
```

### Build the playground
```
pnpm --filter playground build
```

Build is created in the playground/dist/ folder.

