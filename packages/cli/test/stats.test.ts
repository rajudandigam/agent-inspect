import { cp, mkdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { statsCommand } from "../src/stats.js";

describe("stats CLI", () => {
  let tmpDir: string;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    tmpDir = path.join(os.tmpdir(), `ai-stats-${Date.now()}`);
    await mkdir(tmpDir, { recursive: true });
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(async () => {
    logSpy.mockRestore();
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("handles empty directory", async () => {
    await statsCommand({ dir: tmpDir });
    expect(logSpy.mock.calls.flat().join(" ")).toContain("No AgentInspect runs");
  });

  it("aggregates fixture directory", async () => {
    const fixtures = path.resolve(
      path.dirname(new URL(import.meta.url).pathname),
      "../../../fixtures/traces",
    );
    await cp(path.join(fixtures, "minimal-success.jsonl"), path.join(tmpDir, "minimal-success.jsonl"));
    await cp(path.join(fixtures, "minimal-error.jsonl"), path.join(tmpDir, "minimal-error.jsonl"));
    await statsCommand({ dir: tmpDir });
    const out = logSpy.mock.calls.flat().join("\n");
    expect(out).toContain("Runs: 2");
  });

  it("emits valid JSON", async () => {
    const fixtures = path.resolve(
      path.dirname(new URL(import.meta.url).pathname),
      "../../../fixtures/traces",
    );
    await cp(path.join(fixtures, "minimal-success.jsonl"), path.join(tmpDir, "minimal-success.jsonl"));
    await statsCommand({ dir: tmpDir, json: true });
    const parsed = JSON.parse(String(logSpy.mock.calls[0]?.[0]));
    expect(parsed.totalRuns).toBe(1);
    expect(typeof parsed.errorRate).toBe("number");
  });

  it("aggregates v0.2 run metadata and steps", async () => {
    const fixture = path.resolve(
      path.dirname(new URL(import.meta.url).pathname),
      "../../../fixtures/traces-v0.2/dual-format-parity.jsonl",
    );
    await cp(fixture, path.join(tmpDir, "dual-format-parity.jsonl"));

    await statsCommand({
      dir: tmpDir,
      correlationId: "corr_fixture_001",
      groupId: "group_fixture_001",
      json: true,
    });

    const parsed = JSON.parse(String(logSpy.mock.calls[0]?.[0]));
    expect(parsed).toMatchObject({
      totalRuns: 1,
      successCount: 1,
      totalSteps: 1,
      totalToolSteps: 1,
    });
    expect(parsed.slowestRuns[0]?.runId).toBe("run_dual_format_parity");
  });
});
