// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.

/** @type {import("./dotnet")} */
import { dotnet, default as createDotnetRuntimeUntyped } from "./dotnet.js";
import { AssemblyExports } from "./wasm-exports.js";
import { Compiler } from "./WasmCompiler.js";

/** @type {import("./dotnet").CreateDotnetRuntimeType} */
const createDotnetRuntime = createDotnetRuntimeUntyped;

console.log(
  "TODO: Hook into wasm runtime load and send bytes for arrays to create metadata references. Might not be feasible. (Maybe hook into mono_wasm_add_assembly?)"
);
console.log(
  "TODO: Add loading progress hook - see ASP NET Core MonoPlatform.ts for examples."
);
console.log(
  "TODO: Investiage wasm lib: https://github.com/dotnet/runtime/blob/8eb413818f5b95e750be5cf4148a3a9714ddc331/src/mono/wasm/build/WasmApp.targets#L108; https://github.com/dotnet/runtime/issues/77191"
);
//@ts-ignore
window.Compiler = Compiler;
// const style = `
// font-size:1.1rem;
// font-family:sans-serif;
// background-color:0x333;
// `;
// console.log("%cInitialising wasm compiler", style);
// const time = performance.now();
// console.log(`loading files from ${import.meta.url}`);
// await assemblyExports.CompilationInterop.InitAsync(
//   import.meta.url,
//   JSON.stringify(config)
// );
// const diff = performance.now() - time;
// console.log(`%cFinished initialising wasm compiler in ${diff}ms`, style);
