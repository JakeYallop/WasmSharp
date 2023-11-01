// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.

//TODO: Tidy up file

// /** @type {import("./dotnet")} */
// import { dotnet, default as createDotnetRuntimeUntyped } from "./dotnet.js";
import { WasmSharpModule } from "./WasmCompiler.js";

// /** @type {import("./dotnet").CreateDotnetRuntimeType} */
// const createDotnetRuntime = createDotnetRuntimeUntyped;

console.log(
  "TODO: Hook into wasm runtime load and send bytes for arrays to create metadata references. Might not be feasible. (Maybe hook into mono_wasm_add_assembly?)"
);
console.log("TODO: Add loading progress hook - see ASP NET Core MonoPlatform.ts for examples.");
//@ts-ignore
window.AssemblyContext = WasmSharpModule;
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

//const context = await AssemblyContext.createAsync();
//const code = `
//using System;
//Console.WriteLine("Hello World");
//`;
//const compilation = context.createCompilation(code);

//compilation.recompile(code);
//const result = await compilation.run();
//console.log(result.success);
//console.log(result.stdOut);
//console.log(result.stdErr);

//document.getElementById("recompile")?.addEventListener("click", async () => {
//  compilation.recompile(code);
//  const result = await compilation.run();
//  console.log(result.success);
//  console.log(result.stdOut);
//  console.log(result.stdErr);
//});
