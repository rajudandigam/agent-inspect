import { describe, expect, it } from "vitest";

import {
  buildSessionIndex,
  deriveSessionStatus,
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

describe("deriveSessionStatus", () => {
  it("returns running when any run is running", () => {
    expect(
      deriveSessionStatus([
        run("a", { status: "success", startedAt: 1, endedAt: 2 }),
        run("b", { status: "running", startedAt: 3 }),
      ]),
    ).toBe("running");
  });

  it("respects explicit sessionStatus metadata priority", () => {
    expect(
      deriveSessionStatus([
        run("a", {
          status: "success",
          metadata: { sessionStatus: "waiting_input" },
        }),
      ]),
    ).toBe("waiting_input");
  });

  it("returns error when a run failed and none are running", () => {
    expect(
      deriveSessionStatus([
        run("a", { status: "success", startedAt: 1, endedAt: 2 }),
        run("b", { status: "error", startedAt: 3, endedAt: 4 }),
      ]),
    ).toBe("error");
  });

  it("returns completed when all runs succeeded", () => {
    expect(
      deriveSessionStatus([
        run("a", { status: "success", startedAt: 1, endedAt: 2 }),
        run("b", { status: "success", startedAt: 3, endedAt: 4 }),
      ]),
    ).toBe("completed");
  });

  it("returns stale when activity is older than the threshold", () => {
    const now = 1_000_000;
    expect(
      deriveSessionStatus([run("a", { status: "unknown", startedAt: 100 })], {
        nowMs: now,
        staleThresholdMs: 1000,
      }),
    ).toBe("stale");
  });
});

describe("enrichSessionSummary", () => {
  it("derives timing, correlation, and retry count", () => {
    const base = buildSessionIndex([
      run("r1", {
        status: "success",
        startedAt: 10,
        endedAt: 20,
        metadata: { sessionId: "s1", correlationId: "corr", attempt: 2, retryOf: "r0" },
      }),
      run("r2", {
        status: "success",
        startedAt: 30,
        endedAt: 40,
        metadata: { sessionId: "s1", jobId: "job-1", workflowName: "wf" },
      }),
    ]);
    const session = base.sessions[0]!;
    expect(session.status).toBe("completed");
    expect(session.startedAt).toBe(10);
    expect(session.endedAt).toBe(40);
    expect(session.durationMs).toBe(30);
    expect(session.correlationId).toBe("corr");
    expect(session.jobId).toBe("job-1");
    expect(session.workflowId).toBe("wf");
    expect(session.retryCount).toBe(1);
    expect(session.lastActivity).toBe(new Date(40).toISOString());
  });

  it("captures lastError from the latest failed run", () => {
    const index = buildSessionIndex([
      run("r1", {
        status: "error",
        startedAt: 1,
        endedAt: 2,
        metadata: {
          sessionId: "s1",
          errorMessage: "boom",
          errorCode: "E_FAIL",
        },
      }),
    ]);
    expect(index.sessions[0]?.status).toBe("error");
    expect(index.sessions[0]?.lastError).toEqual({
      runId: "r1",
      message: "boom",
      code: "E_FAIL",
    });
  });
});

describe("buildSessionIndex enrichment integration", () => {
  it("enriches fixture sessions with v4.2 fields", async () => {
    const runs: SessionRunRecord[] = [
      run("handoff-planner", {
        status: "success",
        startedAt: 100,
        endedAt: 200,
        metadata: {
          sessionId: "sess-handoff-001",
          handoffFrom: "planner",
          handoffTo: "worker",
        },
      }),
      run("handoff-worker", {
        status: "success",
        startedAt: 201,
        endedAt: 300,
        metadata: { sessionId: "sess-handoff-001" },
      }),
    ];
    const index = buildSessionIndex(runs);
    const session = index.sessions[0]!;
    expect(session.status).toBe("completed");
    expect(session.lastActivity).toBe(new Date(300).toISOString());
    expect(session.handoffs.length).toBeGreaterThan(0);
  });
});
