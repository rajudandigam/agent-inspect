import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["packages/jest/src/index.ts"],
  outDir: "packages/jest/dist",
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
  external: ["agent-inspect", "jest"],
});
