import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["packages/openai-agents/src/index.ts"],
  outDir: "packages/openai-agents/dist",
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
  external: ["agent-inspect", "agent-inspect/writers", "@openai/agents"],
});
