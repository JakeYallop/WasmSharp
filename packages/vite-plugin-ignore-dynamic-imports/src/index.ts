import { Plugin } from "vite";
import AST from "unplugin-ast/vite";
import { type Transformer } from "unplugin-ast";
import type {
  CallExpression,
  Expression,
  ImportExpression,
  MemberExpression,
} from "@babel/types";

export interface Options {
  include?: string[];
}

const GetExpressionString = (node: Expression): string => {
  //TOOD: Support for TemplateLiteral and other expressions
  switch (node.type) {
    case "StringLiteral":
      return node.value;
    case "Identifier":
      return node.name;
    case "MemberExpression":
      return GetMemberExpression(node);
    default:
      throw TypeError(`Unsupported node type ${node.type}`);
  }
};

const GetMemberExpression = (node: MemberExpression) => {
  const _GetMemberExpression = (node: MemberExpression, parts: string[]) => {
    if (node.property.type !== "Identifier") {
      throw TypeError(
        `Unsupported node type found for node.property '${node.type}'`
      );
    }

    if (
      !(
        node.object.type === "MemberExpression" ||
        node.object.type === "Identifier"
      )
    ) {
      throw new TypeError(
        `Unsupported node type found for node.object '${node.object.type}'`
      );
    }
    parts.push(node.property.name);

    if (node.object.type === "Identifier") {
      parts.push(node.object.name);
      return;
    }
    _GetMemberExpression(node.object, parts);
  };

  const parts: string[] = [];
  _GetMemberExpression(node, parts);
  return parts.reverse().join(".");
};

const AddViteIgnoreToDynamicImport2 = (): Transformer<ImportExpression> => ({
  onNode(node) {
    return (
      node.type === "ImportExpression" &&
      (node.source.type === "StringLiteral" ||
        node.source.type === "Identifier" ||
        node.source.type == "MemberExpression")
    );
  },
  async transform(node, code) {
    const exp = GetExpressionString(node.source);
    if (!exp) {
      return;
    }

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
    transformer: [AddViteIgnoreToDynamicImport2()],
  });

  //user plugins cannot be added via a mutated config, so we need to merge the AST plugin directly via destructuring
  return {
    ...plugin,
    enforce: "pre",
    name: "dynamic-imports-ignore-plugin",
  };
}
