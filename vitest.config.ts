import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

/** Config file lives at repo root so Vitest resolves `include` the same when cwd is a package. */
const repoRoot = path.dirname(fileURLToPath(import.meta.url));

const coreEntry = fileURLToPath(
  new URL("./packages/core/src/index.ts", import.meta.url),
);
const coreAdvancedEntry = fileURLToPath(
  new URL("./packages/core/src/entries/advanced.ts", import.meta.url),
);
const coreChecksEntry = fileURLToPath(
  new URL("./packages/core/src/entries/checks.ts", import.meta.url),
);
const coreDiffEntry = fileURLToPath(
  new URL("./packages/core/src/entries/diff.ts", import.meta.url),
);
const coreExportersEntry = fileURLToPath(
  new URL("./packages/core/src/entries/exporters.ts", import.meta.url),
);
const coreLogsEntry = fileURLToPath(
  new URL("./packages/core/src/entries/logs.ts", import.meta.url),
);
const corePersistedEntry = fileURLToPath(
  new URL("./packages/core/src/entries/persisted.ts", import.meta.url),
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

const vitestEntry = fileURLToPath(
  new URL("./packages/vitest/src/index.ts", import.meta.url),
);

const jestEntry = fileURLToPath(
  new URL("./packages/jest/src/index.ts", import.meta.url),
);

const openAiAgentsEntry = fileURLToPath(
  new URL("./packages/openai-agents/src/index.ts", import.meta.url),
);

const harnessEntry = fileURLToPath(
  new URL("./packages/harness/src/index.ts", import.meta.url),
);

const redactEntry = fileURLToPath(
  new URL("./packages/redact/src/index.ts", import.meta.url),
);

const evalEntry = fileURLToPath(
  new URL("./packages/eval/src/index.ts", import.meta.url),
);

const tuiEntry = fileURLToPath(
  new URL("./packages/tui/src/index.ts", import.meta.url),
);

export default defineConfig({
  root: repoRoot,
  resolve: {
    // In-repo tests run before build; point workspace imports at source.
    alias: {
      "@agent-inspect/core/advanced": coreAdvancedEntry,
      "@agent-inspect/core/checks": coreChecksEntry,
      "@agent-inspect/core/diff": coreDiffEntry,
      "@agent-inspect/core/exporters": coreExportersEntry,
      "@agent-inspect/core/logs": coreLogsEntry,
      "@agent-inspect/core/persisted": corePersistedEntry,
      "@agent-inspect/core/readers": coreReadersEntry,
      "@agent-inspect/core/writers": coreWritersEntry,
      "@agent-inspect/core": coreEntry,
      "agent-inspect/advanced": coreAdvancedEntry,
      "agent-inspect/checks": coreChecksEntry,
      "agent-inspect/diff": coreDiffEntry,
      "agent-inspect/exporters": coreExportersEntry,
      "agent-inspect/logs": coreLogsEntry,
      "agent-inspect/persisted": corePersistedEntry,
      "agent-inspect/readers": coreReadersEntry,
      "agent-inspect/writers": coreWritersEntry,
      /** Same entry as published `agent-inspect` — packages/langchain imports `agent-inspect`. */
      "agent-inspect": coreEntry,
      "@agent-inspect/ai-sdk": aiSdkEntry,
      "@agent-inspect/vitest": vitestEntry,
      "@agent-inspect/jest": jestEntry,
      "@agent-inspect/openai-agents": openAiAgentsEntry,
      "@agent-inspect/harness": harnessEntry,
      "@agent-inspect/redact": redactEntry,
      "@agent-inspect/eval": evalEntry,
      "@agent-inspect/langchain": langchainEntry,
      "@agent-inspect/tui": tuiEntry,
    },
  },
  ssr: {
    // Ensure Vite doesn't try to resolve package entrypoints for workspace-only deps.
    noExternal: [
      "@agent-inspect/core",
      "@agent-inspect/core/advanced",
      "@agent-inspect/core/checks",
      "@agent-inspect/core/diff",
      "@agent-inspect/core/exporters",
      "@agent-inspect/core/logs",
      "@agent-inspect/core/persisted",
      "@agent-inspect/core/readers",
      "@agent-inspect/core/writers",
      "agent-inspect",
      "agent-inspect/advanced",
      "agent-inspect/checks",
      "agent-inspect/diff",
      "agent-inspect/exporters",
      "agent-inspect/logs",
      "agent-inspect/persisted",
      "agent-inspect/readers",
      "agent-inspect/writers",
      "@agent-inspect/ai-sdk",
      "@agent-inspect/vitest",
      "@agent-inspect/jest",
      "@agent-inspect/openai-agents",
      "@agent-inspect/harness",
      "@agent-inspect/redact",
      "@agent-inspect/eval",
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
