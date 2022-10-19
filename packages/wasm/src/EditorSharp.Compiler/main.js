// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.

/** @type {import("./dotnet")} */
import { dotnet, default as createDotnetRuntimeUntyped } from "./dotnet.js";

/** @type {import("./dotnet").CreateDotnetRuntimeType} */
const createDotnetRuntime = createDotnetRuntimeUntyped;

const { getAssemblyExports, getConfig, MONO, INTERNAL } = await dotnet
  .withDiagnosticTracing(false)
  .withApplicationArgumentsFromQuery()
  .create();

export const config = getConfig();
/** @type {import("main").AssemblyExports} */
const assemblyExports = await getAssemblyExports(config.mainAssemblyName);
console.log(config);
console.log(dotnet);
console.log(
  "TODO: Hook into wasm runtime load and send bytes for arrays to create metadata references."
);
console.log(
  "TODO: Add loading indicator - see ASP NET Core MonoPlatform.ts for examples."
);
const style = `
font-size:1.1rem;
font-family:sans-serif;
background-color:0x333;
`;
console.log("%cInitialising editor", style);
const time = performance.now();
await assemblyExports.Compiler.InitAsync(JSON.stringify(config));
const diff = performance.now() - time;
console.log(diff);
console.log(`%cFinished initialising editor in ${diff}ms`, style);
