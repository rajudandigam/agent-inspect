import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cohortCommand } from "../src/cohort.js";

const fixtureDir = path.resolve(import.meta.dirname, "../../../fixtures/cohorts/before-after");

describe("cohort command", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    process.exitCode = 0;
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    process.exitCode = 0;
    vi.restoreAllMocks();
  });

  it("rejects an unsupported explicit metric without running the cohort", async () => {
    await cohortCommand({ dir: fixtureDir, metric: "totally-wrong" });

    expect(process.exitCode).toBe(1);
    expect(logSpy).not.toHaveBeenCalled();
    expect(errSpy.mock.calls.flat().join(" ")).toContain(
      'Unsupported cohort --metric value: "totally-wrong"',
    );
  });

  it("rejects mixed valid and unsupported explicit metrics", async () => {
    await cohortCommand({ dir: fixtureDir, metric: "errorRate,totally-wrong" });

    expect(process.exitCode).toBe(1);
    expect(logSpy).not.toHaveBeenCalled();
    expect(errSpy.mock.calls.flat().join(" ")).toContain('"totally-wrong"');
  });

  it("preserves valid explicit metrics", async () => {
    await cohortCommand({
      dir: fixtureDir,
      baseline: "before",
      candidate: "after",
      metric: "errorRate,duration",
      json: true,
    });

    const result = JSON.parse(String(logSpy.mock.calls[0]?.[0] ?? "{}")) as {
      error?: string;
      metrics?: string[];
    };
    expect(result.error).toBeUndefined();
    expect(result.metrics).toEqual(["errorRate", "duration"]);
  });

  it("preserves default metrics when --metric is omitted", async () => {
    await cohortCommand({
      dir: fixtureDir,
      baseline: "before",
      candidate: "after",
      json: true,
    });

    const result = JSON.parse(String(logSpy.mock.calls[0]?.[0] ?? "{}")) as {
      error?: string;
      metrics?: string[];
    };
    expect(result.error).toBeUndefined();
    expect(result.metrics).toEqual([
      "errorRate",
      "duration",
      "toolChoice",
      "observationFailure",
    ]);
  });
});
