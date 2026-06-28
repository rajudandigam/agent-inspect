import { existsSync, readFileSync } from "node:fs";
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

type AdapterConformanceFixture = {
  adapterId: string;
  testFile: string;
  adapterTestFile: string;
  covers: string[];
  notes: string;
};

type AdapterConformanceFixtures = {
  version: number;
  scope: "official-adapters-only";
  certification: "none";
  releaseGateCommand: string;
  defaults: {
    network: "none";
    upload: "none";
    capture: "metadata-only";
  };
  fixtures: AdapterConformanceFixture[];
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

function readFixtures(): AdapterConformanceFixtures {
  const raw = readFileSync(
    path.join(repoRoot, "docs", "implementation", "adapter-conformance-fixtures.json"),
    "utf-8",
  );
  return JSON.parse(raw) as AdapterConformanceFixtures;
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

  it("keeps executable fixture evidence aligned with the matrix", () => {
    const matrix = readMatrix();
    const fixtures = readFixtures();

    expect(fixtures.defaults).toEqual({
      network: "none",
      upload: "none",
      capture: "metadata-only",
    });
    expect(fixtures.scope).toBe("official-adapters-only");
    expect(fixtures.certification).toBe("none");
    expect(fixtures.releaseGateCommand).toContain(
      "packages/core/test/adapter-executable-conformance.test.ts",
    );
    expect(fixtures.releaseGateCommand).toContain(
      "packages/core/test/adapter-conformance-matrix.test.ts",
    );

    const matrixIds = matrix.adapters.map((adapter) => adapter.id).sort();
    const fixtureIds = fixtures.fixtures.map((fixture) => fixture.adapterId).sort();
    expect(fixtureIds).toEqual(matrixIds);

    for (const fixture of fixtures.fixtures) {
      const matrixEntry = matrix.adapters.find((adapter) => adapter.id === fixture.adapterId);
      expect(matrixEntry, `${fixture.adapterId} matrix entry`).toBeDefined();
      expect(fixture.notes.length, `${fixture.adapterId} notes`).toBeGreaterThan(0);
      expect(
        existsSync(path.join(repoRoot, fixture.testFile)),
        `${fixture.adapterId} shared test file`,
      ).toBe(true);
      expect(
        existsSync(path.join(repoRoot, fixture.adapterTestFile)),
        `${fixture.adapterId} adapter test file`,
      ).toBe(true);

      for (const covered of fixture.covers) {
        expect(matrix.requiredSignals, `${fixture.adapterId} covered signal`).toContain(covered);
        expect(matrixEntry?.signals[covered], `${fixture.adapterId} matrix signal`).toBe(
          "covered",
        );
      }
    }
  });
});
