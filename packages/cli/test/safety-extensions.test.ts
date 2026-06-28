import { describe, expect, it } from "vitest";

import { mergeSafetyExtensions } from "../src/safety-extensions.js";

describe("safety-extensions", () => {
  it("merges circuit findings into check results", () => {
    const base = {
      ok: true,
      status: "pass" as const,
      format: "agent-inspect-jsonl",
      summary: { passed: 1, failed: 0, warnings: 0, errors: 0 },
      findings: [],
      diagnostics: [],
    };
    const read = {
      format: "agent-inspect-jsonl",
      events: Array.from({ length: 5 }, (_, index) => ({
        eventId: `e-${index}`,
        runId: "run-1",
        name: "tool:search",
        kind: "tool",
        attributes: { toolName: "search", arguments: { q: "x" } },
      })),
      runs: [],
      warnings: [],
      unsupportedFields: [],
      sourceFiles: [],
    };
    const merged = mergeSafetyExtensions(base, read as never, {
      circuits: ["same-tool-repetition"],
    });
    expect(merged.status).toBe("fail");
    expect(merged.findings.some((finding) => finding.ruleId === "circuit.same-tool-repetition")).toBe(true);
  });
});
