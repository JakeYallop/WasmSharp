// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.

/** @type {import("./dotnet")} */
import { dotnet, default as createDotnetRuntimeUntyped } from "./dotnet.js";
import { AssemblyExports } from "./wasm-exports.js";

/** @type {import("./dotnet").CreateDotnetRuntimeType} */
const createDotnetRuntime = createDotnetRuntimeUntyped;

const {
  getAssemblyExports,
  getConfig,
  setModuleImports,
  MONO,
  INTERNAL,
  BINDING,
  Module,
} = await dotnet
  .withDiagnosticTracing(false)
  .withEnvironmentVariable("assemblyLocations", "")
  .withDebugging(-1)
  .create();

console.log(INTERNAL);
console.log(MONO);
console.log(BINDING);

function prettyPrint(s: any) {
  console.log("printing");
  console.log(JSON.parse(s));
}

setModuleImports("main.js", {
  utils: {
    prettyPrint: prettyPrint,
  },
});

export const config = getConfig();
const assemblyExports: AssemblyExports = await getAssemblyExports(
  config.mainAssemblyName!
);
console.log(
  "TODO: Hook into wasm runtime load and send bytes for arrays to create metadata references. Might not be feasible. (Maybe hook into mono_wasm_add_assembly?)"
);
console.log(
  "TODO: Add loading progress hook - see ASP NET Core MonoPlatform.ts for examples."
);
console.log(
  "TODO: Investiage wasm lib: https://github.com/dotnet/runtime/blob/8eb413818f5b95e750be5cf4148a3a9714ddc331/src/mono/wasm/build/WasmApp.targets#L108; https://github.com/dotnet/runtime/issues/77191"
);
console.log("Test");
const style = `
font-size:1.1rem;
font-family:sans-serif;
background-color:0x333;
`;
console.log("%cInitialising wasm compiler", style);
const time = performance.now();
await assemblyExports.Compiler.InitAsync(INTERNAL.mono_wasm_get_loaded_files());
const diff = performance.now() - time;
console.log(`%cFinished initialising wasm compiler in ${diff}ms`, style);
export const Compiler = assemblyExports.Compiler;
