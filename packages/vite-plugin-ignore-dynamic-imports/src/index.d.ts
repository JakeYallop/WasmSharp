import { Plugin } from "vite";
interface Options {
  include?: string[];
}

export default function ignoreDynamicImports(options?: Options): Plugin;
