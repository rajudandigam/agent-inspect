import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["packages/viewer/src/index.ts"],
  outDir: "packages/viewer/dist",
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
});
