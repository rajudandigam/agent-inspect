import { defineConfig } from "tsup";

export default defineConfig([
  {
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
  },
  {
    entry: ["packages/cli/src/index.ts"],
    outDir: "packages/cli/dist",
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
    banner: {
      js: "#!/usr/bin/env node",
    },
    external: ["@agent-inspect/core"],
  },
]);
