import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const coreEntry = fileURLToPath(
  new URL("./packages/core/src/index.ts", import.meta.url),
);

export default defineConfig({
  resolve: {
    // In-repo tests run before build; point workspace imports at source.
    alias: {
      "@agent-inspect/core": coreEntry,
    },
  },
  server: {
    deps: {
      // Ensure Vite doesn't try to resolve package entrypoints for workspace-only deps.
      inline: [/^@agent-inspect\/core$/],
    },
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
