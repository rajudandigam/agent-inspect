import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // In-repo tests run before build; point workspace imports at source.
      "@agent-inspect/core": new URL("./packages/core/src/index.ts", import.meta.url)
        .pathname,
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
