import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["packages/core/src/index.ts"],
  outDir: "packages/core/dist",
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
  // Bundle ESM-only deps so CJS consumers (Jest 29 / ts-jest / require) do not
  // resolve chalk@5 or nanoid@5 at runtime.
  noExternal: ["chalk", "nanoid"],
});
