import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  TRACE_ARTIFACT_MANIFEST_SCHEMA_VERSION,
  createReporterArtifactPath,
  createReporterFailureDiagnostic,
  createTraceArtifactManifest,
  validateReporterArtifactPath,
} from "../../src/reporters/index.js";

describe("reporters artifact manifest", () => {
  it("creates deterministic manifests without mutating inputs", () => {
    const inputResults = [
      {
        testId: "b",
        name: "beta",
        file: "tests/b.test.ts",
        status: "failed" as const,
        artifacts: [
          {
            kind: "summary" as const,
            path: "tests/b/beta/summary.md",
            format: "md" as const,
            redactionProfile: "share" as const,
          },
        ],
        diagnostics: [
          {
            code: "reporter_failure" as const,
            severity: "error" as const,
            message: "flush failed",
            target: "b",
          },
        ],
      },
      {
        testId: "a",
        name: "alpha",
        file: "tests/a.test.ts",
        status: "passed" as const,
      },
    ];

    const manifest = createTraceArtifactManifest({
      framework: "vitest",
      generatedAt: "2026-06-28T00:00:00.000Z",
      results: inputResults,
      artifacts: [
        {
          kind: "summary",
          path: "tests/b/beta/summary.md",
          format: "md",
          redactionProfile: "share",
        },
        {
          kind: "trace",
          path: "tests/a/alpha/trace.jsonl",
          format: "jsonl",
          redactionProfile: "local",
        },
      ],
    });

    expect(manifest).toEqual({
      schemaVersion: TRACE_ARTIFACT_MANIFEST_SCHEMA_VERSION,
      generatedAt: "2026-06-28T00:00:00.000Z",
      framework: "vitest",
      results: [
        {
          testId: "a",
          name: "alpha",
          file: "tests/a.test.ts",
          status: "passed",
          artifacts: [],
          diagnostics: [],
        },
        {
          testId: "b",
          name: "beta",
          file: "tests/b.test.ts",
          status: "failed",
          artifacts: [
            {
              kind: "summary",
              path: "tests/b/beta/summary.md",
              format: "md",
              redactionProfile: "share",
              diagnostics: [],
            },
          ],
          diagnostics: [
            {
              code: "reporter_failure",
              severity: "error",
              message: "flush failed",
              target: "b",
            },
          ],
        },
      ],
      artifacts: [
        {
          kind: "trace",
          path: "tests/a/alpha/trace.jsonl",
          format: "jsonl",
          redactionProfile: "local",
          diagnostics: [],
        },
        {
          kind: "summary",
          path: "tests/b/beta/summary.md",
          format: "md",
          redactionProfile: "share",
          diagnostics: [],
        },
      ],
      diagnostics: [],
    });

    expect(inputResults[0]?.artifacts?.[0]).not.toHaveProperty("diagnostics");
  });
});

describe("reporters artifact path helpers", () => {
  it("creates safe deterministic paths under an explicit output directory", () => {
    const result = createReporterArtifactPath({
      outputDir: "artifacts/agent-inspect",
      testId: "suite > case #1",
      name: "uses token-safe output",
      file: "tests/reporters/example.test.ts",
      kind: "trace",
      format: "jsonl",
    });

    expect(result.ok).toBe(true);
    expect(result.relativePath).toBe(
      "tests/example/uses-token-safe-output-suite-case-1/trace.jsonl",
    );
    expect(result.absolutePath).toBe(
      path.resolve(
        "artifacts/agent-inspect",
        "tests/example/uses-token-safe-output-suite-case-1/trace.jsonl",
      ),
    );
    expect(result.diagnostics).toEqual([]);
  });

  it("rejects absolute, traversal, empty, and null-byte paths with diagnostics", () => {
    const cases = [
      { relativePath: "", code: "artifact_path_empty" },
      { relativePath: "/tmp/trace.jsonl", code: "artifact_path_absolute" },
      { relativePath: "C:\\temp\\trace.jsonl", code: "artifact_path_absolute" },
      { relativePath: "../trace.jsonl", code: "artifact_path_escape" },
      { relativePath: "safe/../../trace.jsonl", code: "artifact_path_escape" },
      { relativePath: "safe/\0trace.jsonl", code: "invalid_artifact_path" },
    ] as const;

    for (const c of cases) {
      const result = validateReporterArtifactPath({
        outputDir: "artifacts",
        relativePath: c.relativePath,
      });
      expect(result.ok, c.relativePath).toBe(false);
      expect(result.diagnostics[0]?.code).toBe(c.code);
      expect(result.absolutePath).toBeUndefined();
    }
  });
});

describe("reporters diagnostics", () => {
  it("converts reporter failures into diagnostic records", () => {
    expect(createReporterFailureDiagnostic(new Error("disk full"), "summary")).toEqual({
      code: "reporter_failure",
      severity: "error",
      message: "disk full",
      target: "summary",
    });

    expect(createReporterFailureDiagnostic({ unknown: true })).toEqual({
      code: "reporter_failure",
      severity: "error",
      message: "Unknown reporter failure.",
    });
  });
});
