import { defineConfig } from "tsup";

const base = {
  outDir: "packages/tui/dist",
  tsconfig: "packages/tui/tsconfig.json",
  sourcemap: true,
  platform: "node" as const,
  target: "es2022",
  external: ["agent-inspect", "ink", "react"],
};

export default defineConfig([
  {
    ...base,
    entry: ["packages/tui/src/index.ts"],
    format: ["esm"],
    outExtension() {
      return { js: ".mjs" };
    },
    dts: true,
    clean: true,
    treeshake: true,
  },
  {
    ...base,
    entry: { index: "packages/tui/src/index-cjs.ts" },
    format: ["cjs"],
    outExtension() {
      return { js: ".cjs" };
    },
    dts: true,
    clean: false,
    treeshake: true,
  },
]);
