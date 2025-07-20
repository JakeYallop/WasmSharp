declare module "@yukiakai/resolve-package" {
  export function resolvePath(packageName: string, baseDir?: string ): string;
  export function resolveMetadata(packageName: string, baseDir?: string): {
    name: string;
    version: string;
  }
}