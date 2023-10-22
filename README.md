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
