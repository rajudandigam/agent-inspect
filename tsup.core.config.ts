import { defineConfig } from "tsup";

const subpathEntries = {
  advanced: "packages/core/src/entries/advanced.ts",
  persisted: "packages/core/src/entries/persisted.ts",
  logs: "packages/core/src/entries/logs.ts",
  exporters: "packages/core/src/entries/exporters.ts",
  diff: "packages/core/src/entries/diff.ts",
  writers: "packages/core/src/entries/writers.ts",
  readers: "packages/core/src/entries/readers.ts",
} as const;

export default defineConfig({
  entry: {
    index: "packages/core/src/index.ts",
    ...subpathEntries,
  },
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
