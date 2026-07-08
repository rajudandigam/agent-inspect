import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["packages/index-sqlite/src/index.ts"],
  outDir: "packages/index-sqlite/dist",
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
  // Native driver and the public core stay external.
  external: ["better-sqlite3", "agent-inspect"],
});
