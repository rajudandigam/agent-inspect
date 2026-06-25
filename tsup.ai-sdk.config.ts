import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["packages/ai-sdk/src/index.ts"],
  outDir: "packages/ai-sdk/dist",
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
  external: ["ai", "agent-inspect", "agent-inspect/writers"],
});
