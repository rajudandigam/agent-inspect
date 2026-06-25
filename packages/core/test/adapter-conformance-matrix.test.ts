import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

type SignalStatus = "covered" | "planned";

type AdapterMatrixEntry = {
  id: string;
  packageName: string;
  status: string;
  fixtureScope: string;
  installMode: string;
  dependencyBoundary: string;
  requiredHostControls: string[];
  signals: Record<string, SignalStatus>;
  mustNotPersist: string[];
};

type AdapterConformanceMatrix = {
  version: number;
  defaults: {
    network: "none";
    upload: "none";
    capture: "metadata-only";
    rawPayloadsPersistedByDefault: false;
    rootCoreDependencyAllowed: false;
  };
  requiredSignals: string[];
  adapters: AdapterMatrixEntry[];
};

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

function readMatrix(): AdapterConformanceMatrix {
  const raw = readFileSync(
    path.join(repoRoot, "docs", "implementation", "adapter-conformance-matrix.json"),
    "utf-8",
  );
  return JSON.parse(raw) as AdapterConformanceMatrix;
}

describe("adapter conformance matrix", () => {
  it("preserves local-first defaults for every optional adapter", () => {
    const matrix = readMatrix();

    expect(matrix.defaults).toEqual({
      network: "none",
      upload: "none",
      capture: "metadata-only",
      rawPayloadsPersistedByDefault: false,
      rootCoreDependencyAllowed: false,
    });

    expect(matrix.adapters.map((adapter) => adapter.id).sort()).toEqual([
      "ai-sdk",
      "langchain",
      "langgraph",
      "openai-agents",
    ]);
  });

  it("requires every adapter entry to address the shared signal set", () => {
    const matrix = readMatrix();

    for (const adapter of matrix.adapters) {
      expect(adapter.packageName).toMatch(/^@agent-inspect\//);
      expect(adapter.fixtureScope.length).toBeGreaterThan(0);
      expect(adapter.requiredHostControls.length).toBeGreaterThan(0);
      expect(adapter.mustNotPersist.length).toBeGreaterThan(0);
      expect(adapter.dependencyBoundary).not.toContain("root");

      for (const signal of matrix.requiredSignals) {
        expect(adapter.signals[signal]).toMatch(/^(covered|planned)$/);
      }
    }
  });

  it("keeps upload-prone adapters on explicit safe install modes", () => {
    const matrix = readMatrix();
    const openAiAgents = matrix.adapters.find(
      (adapter) => adapter.id === "openai-agents",
    );
    const langGraph = matrix.adapters.find((adapter) => adapter.id === "langgraph");

    expect(openAiAgents?.installMode).toBe("setTraceProcessors-replacement");
    expect(openAiAgents?.requiredHostControls).toContain(
      "do not use addTraceProcessor as the default path",
    );
    expect(langGraph?.packageName).toBe("@agent-inspect/langchain");
    expect(langGraph?.requiredHostControls).toContain(
      "no hosted LangSmith tracing requirement",
    );
  });
});
