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
const coreReportersEntry = fileURLToPath(
  new URL("./packages/core/src/entries/reporters.ts", import.meta.url),
);
const coreWritersEntry = fileURLToPath(
  new URL("./packages/core/src/entries/writers.ts", import.meta.url),
);
const coreWorkspaceEntry = fileURLToPath(
  new URL("./packages/core/src/entries/workspace.ts", import.meta.url),
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

const mcpEntry = fileURLToPath(
  new URL("./packages/mcp/src/index.ts", import.meta.url),
);

const guardrailsEntry = fileURLToPath(
  new URL("./packages/guardrails/src/index.ts", import.meta.url),
);

const circuitEntry = fileURLToPath(
  new URL("./packages/circuit/src/index.ts", import.meta.url),
);

const viewerEntry = fileURLToPath(
  new URL("./packages/viewer/src/index.ts", import.meta.url),
);

const mcpServerEntry = fileURLToPath(
  new URL("./packages/mcp-server/src/index.ts", import.meta.url),
);

const adapterSdkEntry = fileURLToPath(
  new URL("./packages/adapter-sdk/src/index.ts", import.meta.url),
);

const tuiEntry = fileURLToPath(
  new URL("./packages/tui/src/index.ts", import.meta.url),
);

const indexSqliteEntry = fileURLToPath(
  new URL("./packages/index-sqlite/src/index.ts", import.meta.url),
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
      "@agent-inspect/core/reporters": coreReportersEntry,
      "@agent-inspect/core/writers": coreWritersEntry,
      "@agent-inspect/core/workspace": coreWorkspaceEntry,
      "@agent-inspect/core": coreEntry,
      "agent-inspect/advanced": coreAdvancedEntry,
      "agent-inspect/checks": coreChecksEntry,
      "agent-inspect/diff": coreDiffEntry,
      "agent-inspect/exporters": coreExportersEntry,
      "agent-inspect/logs": coreLogsEntry,
      "agent-inspect/persisted": corePersistedEntry,
      "agent-inspect/readers": coreReadersEntry,
      "agent-inspect/reporters": coreReportersEntry,
      "agent-inspect/writers": coreWritersEntry,
      "agent-inspect/workspace": coreWorkspaceEntry,
      /** Same entry as published `agent-inspect` — packages/langchain imports `agent-inspect`. */
      "agent-inspect": coreEntry,
      "@agent-inspect/ai-sdk": aiSdkEntry,
      "@agent-inspect/vitest": vitestEntry,
      "@agent-inspect/jest": jestEntry,
      "@agent-inspect/openai-agents": openAiAgentsEntry,
      "@agent-inspect/harness": harnessEntry,
      "@agent-inspect/redact": redactEntry,
      "@agent-inspect/eval": evalEntry,
      "@agent-inspect/mcp": mcpEntry,
      "@agent-inspect/guardrails": guardrailsEntry,
      "@agent-inspect/circuit": circuitEntry,
      "@agent-inspect/viewer": viewerEntry,
      "@agent-inspect/mcp-server": mcpServerEntry,
      "@agent-inspect/adapter-sdk": adapterSdkEntry,
      "@agent-inspect/langchain": langchainEntry,
      "@agent-inspect/tui": tuiEntry,
      "@agent-inspect/index-sqlite": indexSqliteEntry,
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
      "@agent-inspect/core/reporters",
      "@agent-inspect/core/writers",
      "@agent-inspect/core/workspace",
      "agent-inspect",
      "agent-inspect/advanced",
      "agent-inspect/checks",
      "agent-inspect/diff",
      "agent-inspect/exporters",
      "agent-inspect/logs",
      "agent-inspect/persisted",
      "agent-inspect/readers",
      "agent-inspect/reporters",
      "agent-inspect/writers",
      "agent-inspect/workspace",
      "@agent-inspect/ai-sdk",
      "@agent-inspect/vitest",
      "@agent-inspect/jest",
      "@agent-inspect/openai-agents",
      "@agent-inspect/harness",
      "@agent-inspect/redact",
      "@agent-inspect/eval",
      "@agent-inspect/mcp",
      "@agent-inspect/guardrails",
      "@agent-inspect/circuit",
      "@agent-inspect/viewer",
      "@agent-inspect/mcp-server",
      "@agent-inspect/adapter-sdk",
      "@agent-inspect/langchain",
      "@agent-inspect/tui",
      "@agent-inspect/index-sqlite",
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
