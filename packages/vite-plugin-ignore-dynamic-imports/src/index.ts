import { Plugin } from "vite";
import AST from "unplugin-ast/vite";
import { type Transformer } from "unplugin-ast";
import type {
  CallExpression,
  Expression,
  ImportExpression,
  MemberExpression,
} from "@babel/types";
import * as generate from "@babel/generator";

export interface Options {
  include?: string[];
}

const GetExpressionString = (node: Expression): string => {
  const { code } = generate.generate(node, { comments: false, compact: true})
  return code;
};

const AddViteIgnoreToDynamicImport = (): Transformer<ImportExpression> => ({
  onNode(node) {
    return (
      node.type === "ImportExpression"
    );
  },
  async transform(node, code) {
    const exp = GetExpressionString(node.source);
    return `import(/* @vite-ignore */${exp})`;
  },
});

export default function ignoreDynamicImports(options?: Options): Plugin {
  const plugin = AST({
    include: options?.include ?? [],
    exclude: undefined,
    enforce: undefined,
    parserOptions: {
      createImportExpressions: true,
    },
    transformer: [AddViteIgnoreToDynamicImport()],
  });

  //user plugins cannot be added via a mutated config, so we need to merge the AST plugin directly via destructuring
  return {
    ...plugin,
    enforce: "pre",
    name: "vite-plugin-ignore-dynamic-imports",
  };
}
