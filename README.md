## See the demo

https://wasmsharp.pages.dev/

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

### Building @wasmsharp/core

```
pnpm run build:core
```

### Run tests

```
pnpm test
```

## Deploying the Playground

### publish the Core project:

```
cd /packages/core && dotnet publish -c Release
```

### Build the playground
```
pnpm --filter playground build
```

Build is created in the playground/dist/ folder.

