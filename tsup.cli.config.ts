import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["packages/cli/src/index.ts"],
  outDir: "packages/cli/dist",
  format: ["esm", "cjs"],
  outExtension({ format }) {
    return { js: format === "esm" ? ".mjs" : ".cjs" };
  },
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  platform: "node",
  target: "es2022",
  external: ["@agent-inspect/tui"],
  noExternal: ["chalk", "nanoid"],
});
