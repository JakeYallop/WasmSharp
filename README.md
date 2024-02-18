## See the demo

https://wasmsharp.pages.dev/

## Development setup

This project uses pnpm. Installation instructions for pnpm can be found [here](https://pnpm.io/installation).

### Prerequisites
* pnpm
* .NET 8.0 SDK or greater
  * Ensure the `wasm-tools` workload is installed. It can be installed using
  ```
  dotnet workload install wasm-tools
  ```

### Install packages
```
pnpm i
```

### Build all required depedencies to run the playground
```
pnpm init-playground-deps
```

### Run the playground

```
pnpm start
```

### Building @wasmsharp/core

```
pnpm build:core
```

### Run tests

```
pnpm test
```

## Deploying the Playground

### Build the playground
```
pnpm --filter playground build
```

Build is created in the playground/dist/ folder.

### Serve the production build of the playground
```
pnpm serve
```

Building and serving the playground has a shortcut command:
```
pnpm build-serve
```

Building @wasmsharp/core, building the playground, and then previewing it has a shortcut command:
```
pnpm all
```