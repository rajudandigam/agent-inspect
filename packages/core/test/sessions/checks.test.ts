import { describe, expect, it } from "vitest";

import { aggregateSessionCheckResults } from "../../src/sessions/checks.js";
import type { TraceCheckResult } from "../../src/checks/index.js";

function runResult(
  runId: string,
  status: TraceCheckResult["status"],
): TraceCheckResult {
  return {
    ok: status === "pass",
    status,
    format: "agent-inspect-jsonl",
    runId,
    summary: {
      passed: status === "pass" ? 1 : 0,
      failed: status === "fail" ? 1 : 0,
      warnings: 0,
      errors: status === "error" ? 1 : 0,
    },
    findings:
      status === "fail"
        ? [
            {
              ruleId: "run.status",
              severity: "error",
              status: "fail",
              message: "run failed",
              evidence: [{ runId }],
            },
          ]
        : [],
    diagnostics: [],
  };
}

describe("aggregateSessionCheckResults", () => {
  it("aggregates per-run findings with run evidence", () => {
    const result = aggregateSessionCheckResults(
      [runResult("run-a", "pass"), runResult("run-b", "fail")],
      {
        scopeKind: "session",
        scopeLabel: "sess-1",
        runIds: ["run-a", "run-b"],
      },
    );
    expect(result.status).toBe("fail");
    expect(result.runResults).toEqual([
      { runId: "run-a", status: "pass" },
      { runId: "run-b", status: "fail" },
    ]);
    expect(result.findings[0]?.evidence[0]?.runId).toBe("run-b");
  });

  it("returns error when session is missing", () => {
    const result = aggregateSessionCheckResults([], {
      scopeKind: "session",
      scopeLabel: "missing",
      runIds: [],
      notFound: true,
    });
    expect(result.status).toBe("error");
    expect(result.diagnostics[0]?.code).toBe("AI_CHECK_INVALID_ARGUMENTS");
  });
});
