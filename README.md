<h2 align='center'><samp>WasmSharp</samp></h2>

<p align='center'>
Compile and run C# programs locally from your web browser, no server necessary. Diagnostics and completions are supported.</p>

## Live demo

https://wasmsharp.pages.dev/

## Getting started

Compile and run C# programs using WASM:
```typescript
const module = await WasmSharpModule.initializeAsync()
const compilation = await module.createCompilationAsync(`
  using System;
  Console.WriteLine("Hello World!");
`)
const result = await compilation.run();
console.log(result.success); // true
console.log(result.stdOut); // Hello World!
```

```typescript
const module = await WasmSharpModule.initializeAsync()
const compilation = await module.createCompilationAsync(`
  using System;
  // intentional error - missing Console in front of "WriteLine"
  WriteLine("Hello World!");
`)
const result = await compilation.run();
console.log(result.success); // false
console.log(result.diagnostics);
/*
[
  {
    "id": "CS0103",
    "message": "The name 'WriteLine' does not exist in the current context",
    "location": {
      "start": 3,
      "end": 12,
      "length": 9,
      "isEmpty": false
    },
    "severity": "Error"
  }
]
*/
```

## Troubleshooting
 
Web worker mode (the default mode) requires a HTTPS URL (or localhost in some browsers). Disable web worker mode using `disableWebWorker: true`:
```ts
const module = await WasmSharpModule.initializeAsync({
  disableWebWorker: true
})
```

## Development setup

This project uses pnpm. Installation instructions for pnpm can be found [here](https://pnpm.io/installation).

### Prerequisites
* pnpm
* .NET 10.0 SDK or greater
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