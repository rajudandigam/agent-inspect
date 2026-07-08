import { describe, expect, it } from "vitest";

import {
  aggregateBundleSafeStatus,
  bundleFailsOnSafety,
  resolveBundleRunIds,
  toMetadataSafeStatus,
} from "../../src/bundle/index.js";
import type { SessionIndex, SessionRunRecord } from "../../src/sessions/types.js";

function run(runId: string, startedAt?: number): SessionRunRecord {
  return { runId, startedAt };
}

function index(sessions: SessionIndex["sessions"], runs: SessionRunRecord[] = []): SessionIndex {
  return {
    runs,
    sessions,
    unscopedRunIds: [],
    warnings: [],
  };
}

describe("resolveBundleRunIds", () => {
  const runs = [run("run-a", Date.now() - 60_000), run("run-b", Date.now() - 86_400_000)];

  it("resolves a single run id", () => {
    const result = resolveBundleRunIds(index([], runs), runs, { runId: "run-a" });
    expect(result.runIds).toEqual(["run-a"]);
  });

  it("resolves session runs in stable order", () => {
    const result = resolveBundleRunIds(
      index([
        {
          sessionId: "sess-1",
          runIds: ["run-b", "run-a"],
          groups: [],
          handoffs: [],
          retries: [],
          criticalPath: [],
          status: "completed",
          lastActivity: new Date().toISOString(),
          retryCount: 0,
        },
      ]),
      runs,
      { sessionId: "sess-1" },
    );
    expect(result.runIds).toEqual(["run-a", "run-b"]);
    expect(result.sessionId).toBe("sess-1");
  });

  it("rejects ambiguous targets", () => {
    expect(() =>
      resolveBundleRunIds(index([], runs), runs, { runId: "run-a", since: "24h" }),
    ).toThrow(/only one target/);
  });
});

describe("aggregateBundleSafeStatus", () => {
  it("aggregates worst status", () => {
    expect(
      aggregateBundleSafeStatus(["SAFE", "SAFE WITH WARNINGS", "SAFE"]),
    ).toBe("SAFE WITH WARNINGS");
    expect(aggregateBundleSafeStatus(["SAFE", "UNSAFE"])).toBe("UNSAFE");
  });

  it("maps metadata status", () => {
    expect(toMetadataSafeStatus("SAFE WITH WARNINGS")).toBe("SAFE_WITH_WARNINGS");
  });

  it("fails on unsafe unless allowed", () => {
    expect(bundleFailsOnSafety("UNSAFE", false)).toBe(true);
    expect(bundleFailsOnSafety("UNSAFE", true)).toBe(false);
    expect(bundleFailsOnSafety("SAFE", false)).toBe(false);
  });
});
