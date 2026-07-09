import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["packages/studio/src/index.ts"],
  outDir: "packages/studio/dist",
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
  external: [
    "better-sqlite3",
    "agent-inspect",
    "agent-inspect/advanced",
    "agent-inspect/checks",
    "agent-inspect/diff",
    "agent-inspect/persisted",
    "agent-inspect/readers",
    "agent-inspect/workspace",
  ],
});
