import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["packages/tui/src/index.ts"],
  outDir: "packages/tui/dist",
  format: ["esm", "cjs"],
  outExtension({ format }) {
    return { js: format === "esm" ? ".mjs" : ".cjs" };
  },
  dts: true,
  tsconfig: "packages/tui/tsconfig.json",
  sourcemap: true,
  clean: true,
  treeshake: true,
  platform: "node",
  target: "es2022",
  external: ["agent-inspect", "ink", "react"],
});
