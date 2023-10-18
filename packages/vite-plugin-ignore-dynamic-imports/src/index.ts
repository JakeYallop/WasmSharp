import MagicString from "magic-string";
import { ResolvedConfig, createFilter, Plugin } from "vite";

function hasDynamicImports(code: string) {
  const re = /\bimport\w*?\(/;
  return re.test(code);
}
interface Options {
  include?: string[];
}

/**
 * Ast tree walk https://github.com/vite-plugin/vite-plugin-utils/blob/main/function/index.ts
 */
async function walk(
  ast: Record<string, any>,
  visitors: {
    [type: string]: (node: Record<string, any>) => void | Promise<void>;
  }
) {
  if (!ast) return;

  if (Array.isArray(ast)) {
    for (const element of ast as Record<string, any>[]) {
      await walk(element, visitors);
    }
  } else {
    for (const key of Object.keys(ast)) {
      await (typeof ast[key] === "object" && walk(ast[key], visitors));
    }
  }

  await visitors[ast.type]?.(ast);
}

export default function ignoreDynamicImports(options?: Options): Plugin {
  let config: ResolvedConfig;
  const filter = createFilter(options?.include);
  let noTransforms = 0;
  return {
    name: "dynamic-imports-ignore-plugin",
    configResolved(this, resolvedConfig: ResolvedConfig) {
      noTransforms = 0;
      config = resolvedConfig;
    },
    transform: {
      order: "pre",
      async handler(this, code, id) {
        noTransforms++;
        if (filter(id) && hasDynamicImports(code)) {
          const s = new MagicString(code);
          const ast = this.parse(code);
          await walk(ast, {
            ImportExpression(node) {
              if (node.source.type == "Identifier") {
                s.overwrite(
                  node.start,
                  node.end,
                  `import(/* @vite-ignore */${node.source.name})`
                );
                const before = s.original.slice(node.start - 20, node.end + 20);
                var after = s.toString().slice(node.start - 20, node.end + 20);
              }
            },
          });
          return s.toString();
        }
      },
    },
  };
}
