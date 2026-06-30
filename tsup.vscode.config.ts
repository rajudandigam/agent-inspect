import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["packages/vscode/src/extension.ts"],
  outDir: "packages/vscode/dist",
  format: ["cjs"],
  outExtension() {
    return { js: ".cjs" };
  },
  sourcemap: true,
  clean: true,
  treeshake: true,
  platform: "node",
  target: "es2022",
  external: ["vscode"],
});
