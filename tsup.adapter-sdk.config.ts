import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["packages/adapter-sdk/src/index.ts"],
  outDir: "packages/adapter-sdk/dist",
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
  external: ["agent-inspect", "agent-inspect/persisted", "agent-inspect/readers"],
});
