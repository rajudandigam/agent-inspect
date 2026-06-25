import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

/** Config file lives at repo root so Vitest resolves `include` the same when cwd is a package. */
const repoRoot = path.dirname(fileURLToPath(import.meta.url));

const coreEntry = fileURLToPath(
  new URL("./packages/core/src/index.ts", import.meta.url),
);
const coreReadersEntry = fileURLToPath(
  new URL("./packages/core/src/entries/readers.ts", import.meta.url),
);
const coreWritersEntry = fileURLToPath(
  new URL("./packages/core/src/entries/writers.ts", import.meta.url),
);

const langchainEntry = fileURLToPath(
  new URL("./packages/langchain/src/index.ts", import.meta.url),
);

const aiSdkEntry = fileURLToPath(
  new URL("./packages/ai-sdk/src/index.ts", import.meta.url),
);

const openAiAgentsEntry = fileURLToPath(
  new URL("./packages/openai-agents/src/index.ts", import.meta.url),
);

const tuiEntry = fileURLToPath(
  new URL("./packages/tui/src/index.ts", import.meta.url),
);

export default defineConfig({
  root: repoRoot,
  resolve: {
    // In-repo tests run before build; point workspace imports at source.
    alias: {
      "@agent-inspect/core/readers": coreReadersEntry,
      "@agent-inspect/core/writers": coreWritersEntry,
      "@agent-inspect/core": coreEntry,
      "agent-inspect/writers": coreWritersEntry,
      /** Same entry as published `agent-inspect` — packages/langchain imports `agent-inspect`. */
      "agent-inspect": coreEntry,
      "@agent-inspect/ai-sdk": aiSdkEntry,
      "@agent-inspect/openai-agents": openAiAgentsEntry,
      "@agent-inspect/langchain": langchainEntry,
      "@agent-inspect/tui": tuiEntry,
    },
  },
  ssr: {
    // Ensure Vite doesn't try to resolve package entrypoints for workspace-only deps.
    noExternal: [
      "@agent-inspect/core",
      "@agent-inspect/core/readers",
      "@agent-inspect/core/writers",
      "agent-inspect",
      "agent-inspect/writers",
      "@agent-inspect/ai-sdk",
      "@agent-inspect/openai-agents",
      "@agent-inspect/langchain",
      "@agent-inspect/tui",
    ],
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
