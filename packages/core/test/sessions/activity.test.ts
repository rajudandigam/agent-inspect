import { describe, expect, it } from "vitest";

import {
  buildActivitySummary,
  buildSessionIndex,
  renderActivitySummaryHuman,
  type SessionRunRecord,
} from "../../src/sessions/index.js";

function run(
  id: string,
  opts: {
    status?: SessionRunRecord["status"];
    startedAt?: number;
    endedAt?: number;
    metadata?: Record<string, unknown>;
  } = {},
): SessionRunRecord {
  return {
    runId: id,
    status: opts.status,
    startedAt: opts.startedAt,
    endedAt: opts.endedAt,
    metadata: opts.metadata,
  };
}

describe("buildActivitySummary", () => {
  const now = Date.parse("2026-07-08T12:00:00.000Z");

  it("counts sessions, failures, stale, and guardrail warnings in the window", () => {
    const index = buildSessionIndex(
      [
        run("ok", {
          status: "success",
          startedAt: now - 3_600_000,
          endedAt: now - 3_000_000,
          metadata: { sessionId: "s-ok", checkSummary: { pass: 1, fail: 0, warn: 1 } },
        }),
        run("err", {
          status: "error",
          startedAt: now - 7_200_000,
          endedAt: now - 6_000_000,
          metadata: {
            sessionId: "s-err",
            errorMessage: "refund-policy tool",
          },
        }),
        run("old", {
          status: "unknown",
          startedAt: now - 700_000_000,
          endedAt: now - 699_000_000,
          metadata: { sessionId: "s-old" },
        }),
      ],
      { nowMs: now, staleThresholdMs: 86_400_000 },
    );

    const summary = buildActivitySummary(index, { since: "7d", nowMs: now, limit: 10 });
    expect(summary.sessions).toBe(2);
    expect(summary.failed).toBe(1);
    expect(summary.guardrailWarnings).toBe(1);
    expect(summary.entries.map((e) => e.sessionId).sort()).toEqual(["s-err", "s-ok"]);
  });

  it("renders human output with today and aggregate sections", () => {
    const index = buildSessionIndex([
      run("r1", {
        status: "error",
        startedAt: now - 1000,
        endedAt: now - 500,
        metadata: { sessionId: "s1", errorMessage: "tool failed" },
      }),
    ]);
    const summary = buildActivitySummary(index, { since: "1d", nowMs: now });
    const text = renderActivitySummaryHuman(summary, { nowMs: now });
    expect(text).toContain("Today");
    expect(text).toContain("failed");
    expect(text).toContain("1 sessions");
  });
});
