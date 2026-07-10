import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { extractMetadata } from "../src/trace-metadata.js";
import { buildTraceStats } from "../src/stats.js";

const fixturesDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../fixtures/traces",
);
const fixturesV02Dir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../fixtures/traces-v0.2",
);

describe("buildTraceStats", () => {
  it("aggregates run counts and error rate", async () => {
    const files = ["minimal-success.jsonl", "minimal-error.jsonl"];
    const metas = await Promise.all(
      files.map((f) => extractMetadata(path.join(fixturesDir, f))),
    );
    const stats = await buildTraceStats(metas, {
      traceDir: fixturesDir,
    });
    expect(stats.totalRuns).toBe(2);
    expect(stats.successCount).toBe(1);
    expect(stats.errorCount).toBe(1);
    expect(stats.errorRate).toBe(0.5);
    expect(stats.totalSteps).toBeGreaterThan(0);
  });

  it("computes duration percentiles", async () => {
    const metas = [
      await extractMetadata(path.join(fixturesDir, "minimal-success.jsonl")),
      await extractMetadata(path.join(fixturesDir, "tool-with-io.jsonl")),
    ];
    const stats = await buildTraceStats(metas, { traceDir: fixturesDir });
    expect(stats.duration.minMs).toBeDefined();
    expect(stats.duration.p50Ms).toBeDefined();
    expect(stats.duration.avgMs).toBeDefined();
  });

  it("filters by correlation metadata when no match", async () => {
    const meta = await extractMetadata(
      path.join(fixturesDir, "minimal-success.jsonl"),
    );
    const stats = await buildTraceStats([meta], {
      traceDir: fixturesDir,
      correlationId: "no-such-correlation-id",
    });
    expect(stats.totalRuns).toBe(0);
  });

  it("matches v0.1 and v0.2 stats using exact file paths", async () => {
    const v01Meta = await extractMetadata(
      path.join(fixturesDir, "dual-format-parity.jsonl"),
    );
    const v02Meta = await extractMetadata(
      path.join(fixturesV02Dir, "dual-format-parity.jsonl"),
    );

    const v01 = await buildTraceStats([v01Meta], {
      traceDir: fixturesDir,
      correlationId: "corr_fixture_001",
      groupId: "group_fixture_001",
    });
    const v02 = await buildTraceStats([v02Meta], {
      traceDir: fixturesV02Dir,
      correlationId: "corr_fixture_001",
      groupId: "group_fixture_001",
    });

    for (const stats of [v01, v02]) {
      expect(stats.totalRuns).toBe(1);
      expect(stats.successCount).toBe(1);
      expect(stats.totalSteps).toBe(1);
      expect(stats.totalToolSteps).toBe(1);
      expect(stats.duration.avgMs).toBe(1000);
      expect(stats.slowestSteps[0]?.stepName).toBe("fixture-search");
    }
  });
});
