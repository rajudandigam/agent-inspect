import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

/** Config file lives at repo root so Vitest resolves `include` the same when cwd is a package. */
const repoRoot = path.dirname(fileURLToPath(import.meta.url));

const coreEntry = fileURLToPath(
  new URL("./packages/core/src/index.ts", import.meta.url),
);

const langchainEntry = fileURLToPath(
  new URL("./packages/langchain/src/index.ts", import.meta.url),
);

export default defineConfig({
  root: repoRoot,
  resolve: {
    // In-repo tests run before build; point workspace imports at source.
    alias: {
      "@agent-inspect/core": coreEntry,
      "@agent-inspect/langchain": langchainEntry,
    },
  },
  ssr: {
    // Ensure Vite doesn't try to resolve package entrypoints for workspace-only deps.
    noExternal: ["@agent-inspect/core", "@agent-inspect/langchain"],
  },
  test: {
    environment: "node",
    include: ["packages/**/*.test.ts"],
    exclude: ["**/dist/**", "**/node_modules/**", "docs/**", "examples/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      exclude: [
        "**/dist/**",
        "**/*.config.ts",
        "**/*.config.mjs",
        "**/test/**",
        "examples/**",
      ],
    },
  },
});
