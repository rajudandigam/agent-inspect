import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { diffCommand } from "../src/diff.js";

function jsonlLines(events: Record<string, unknown>[]): string {
  return events.map((e) => JSON.stringify(e)).join("\n") + "\n";
}

/** Minimal successful run: plan + tool, both success */
function traceSuccess(runId: string, toolDurationMs: number, runDurationMs: number) {
  return jsonlLines([
    {
      schemaVersion: "0.1",
      event: "run_started",
      timestamp: 1,
      runId,
      name: "demo",
      startTime: 100,
    },
    {
      schemaVersion: "0.1",
      event: "step_started",
      timestamp: 2,
      runId,
      stepId: "plan",
      name: "plan",
      type: "logic",
      startTime: 101,
    },
    {
      schemaVersion: "0.1",
      event: "step_completed",
      timestamp: 3,
      runId,
      stepId: "plan",
      status: "success",
      endTime: 110,
      durationMs: 9,
    },
    {
      schemaVersion: "0.1",
      event: "step_started",
      timestamp: 4,
      runId,
      stepId: "search",
      name: "search-hotels",
      type: "tool",
      startTime: 111,
    },
    {
      schemaVersion: "0.1",
      event: "step_completed",
      timestamp: 5,
      runId,
      stepId: "search",
      status: "success",
      endTime: 120,
      durationMs: toolDurationMs,
    },
    {
      schemaVersion: "0.1",
      event: "run_completed",
      timestamp: 6,
      runId,
      status: "success",
      endTime: 121,
      durationMs: runDurationMs,
    },
  ]);
}

function traceError(runId: string) {
  return jsonlLines([
    {
      schemaVersion: "0.1",
      event: "run_started",
      timestamp: 1,
      runId,
      name: "demo",
      startTime: 100,
    },
    {
      schemaVersion: "0.1",
      event: "step_started",
      timestamp: 2,
      runId,
      stepId: "plan",
      name: "plan",
      type: "logic",
      startTime: 101,
    },
    {
      schemaVersion: "0.1",
      event: "step_completed",
      timestamp: 3,
      runId,
      stepId: "plan",
      status: "success",
      endTime: 110,
      durationMs: 9,
    },
    {
      schemaVersion: "0.1",
      event: "step_started",
      timestamp: 4,
      runId,
      stepId: "search",
      name: "search-hotels",
      type: "tool",
      startTime: 111,
    },
    {
      schemaVersion: "0.1",
      event: "step_completed",
      timestamp: 5,
      runId,
      stepId: "search",
      status: "error",
      endTime: 120,
      durationMs: 9,
      error: { message: "tool failed" },
    },
    {
      schemaVersion: "0.1",
      event: "run_completed",
      timestamp: 6,
      runId,
      status: "error",
      endTime: 121,
      durationMs: 50,
      error: { message: "run failed" },
    },
  ]);
}

describe("diff CLI", () => {
  let traceDir: string;
  const prevEnv = process.env.AGENT_INSPECT_TRACE_DIR;

  beforeEach(async () => {
    traceDir = path.join(os.tmpdir(), `agent-inspect-cli-diff-${Date.now()}`);
    await mkdir(traceDir, { recursive: true });
    delete process.env.AGENT_INSPECT_TRACE_DIR;
  });

  afterEach(async () => {
    process.exitCode = 0;
    vi.restoreAllMocks();
    try {
      await rm(traceDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
    if (prevEnv === undefined) delete process.env.AGENT_INSPECT_TRACE_DIR;
    else process.env.AGENT_INSPECT_TRACE_DIR = prevEnv;
  });

  it("human output reports no differences for identical traces", async () => {
    const a = traceSuccess("run_a", 20, 100);
    await writeFile(path.join(traceDir, "run_a.jsonl"), a, "utf-8");
    await writeFile(path.join(traceDir, "run_b.jsonl"), a, "utf-8");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await diffCommand("run_a", "run_b", { dir: traceDir });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).toContain("(none)");
    expect(process.exitCode ?? 0).toBe(0);
    logSpy.mockRestore();
  });

  it("human output shows differences for failing step", async () => {
    await writeFile(path.join(traceDir, "run_a.jsonl"), traceSuccess("run_a", 20, 100), "utf-8");
    await writeFile(path.join(traceDir, "run_b.jsonl"), traceError("run_b"), "utf-8");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await diffCommand("run_a", "run_b", { dir: traceDir });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).toContain("step-status");
    expect(out).toContain("search-hotels");
    expect(process.exitCode ?? 0).toBe(0);
    logSpy.mockRestore();
  });

  it("--json output is parseable", async () => {
    await writeFile(path.join(traceDir, "run_a.jsonl"), traceSuccess("run_a", 20, 100), "utf-8");
    await writeFile(path.join(traceDir, "run_b.jsonl"), traceError("run_b"), "utf-8");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await diffCommand("run_a", "run_b", { dir: traceDir, json: true });
    const raw = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    const parsed = JSON.parse(raw) as { summary: { totalDifferences: number }; differences: unknown[] };
    expect(parsed.summary.totalDifferences).toBeGreaterThan(0);
    expect(Array.isArray(parsed.differences)).toBe(true);
    logSpy.mockRestore();
  });

  it("--ignore-duration suppresses timing diff", async () => {
    await writeFile(
      path.join(traceDir, "run_a.jsonl"),
      traceSuccess("run_a", 10, 100),
      "utf-8",
    );
    await writeFile(
      path.join(traceDir, "run_b.jsonl"),
      traceSuccess("run_b", 99, 100),
      "utf-8",
    );
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await diffCommand("run_a", "run_b", { dir: traceDir, ignoreDuration: true });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).not.toMatch(/Step duration differs/);
    logSpy.mockRestore();
  });

  it("--duration-threshold accepts ms", async () => {
    await writeFile(
      path.join(traceDir, "run_a.jsonl"),
      traceSuccess("run_a", 10, 100),
      "utf-8",
    );
    await writeFile(
      path.join(traceDir, "run_b.jsonl"),
      traceSuccess("run_b", 15, 100),
      "utf-8",
    );
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await diffCommand("run_a", "run_b", {
      dir: traceDir,
      durationThreshold: "500ms",
    });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).not.toMatch(/Step duration differs/);
    logSpy.mockRestore();
  });

  it("--focus errors shows only error-related rows", async () => {
    await writeFile(path.join(traceDir, "run_a.jsonl"), traceSuccess("run_a", 20, 100), "utf-8");
    await writeFile(path.join(traceDir, "run_b.jsonl"), traceError("run_b"), "utf-8");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await diffCommand("run_a", "run_b", { dir: traceDir, focus: "errors" });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).not.toMatch(/Step duration differs/);
    expect(out).toMatch(/step-status|run-status|error/);
    logSpy.mockRestore();
  });

  it("--focus structure omits status-only noise when structure unchanged", async () => {
    await writeFile(path.join(traceDir, "run_a.jsonl"), traceSuccess("run_a", 20, 100), "utf-8");
    await writeFile(path.join(traceDir, "run_b.jsonl"), traceError("run_b"), "utf-8");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await diffCommand("run_a", "run_b", { dir: traceDir, focus: "structure" });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).toContain("(none)");
    logSpy.mockRestore();
  });

  it("--focus outputs shows metadata/output changes only", async () => {
    const left = jsonlLines([
      {
        schemaVersion: "0.1",
        event: "run_started",
        timestamp: 1,
        runId: "run_a",
        name: "n",
        startTime: 1,
      },
      {
        schemaVersion: "0.1",
        event: "step_started",
        timestamp: 2,
        runId: "run_a",
        stepId: "s",
        name: "step",
        type: "logic",
        startTime: 2,
        metadata: { outputPreview: "left" },
      },
      {
        schemaVersion: "0.1",
        event: "step_completed",
        timestamp: 3,
        runId: "run_a",
        stepId: "s",
        status: "success",
        endTime: 3,
        durationMs: 1,
      },
      {
        schemaVersion: "0.1",
        event: "run_completed",
        timestamp: 4,
        runId: "run_a",
        status: "success",
        endTime: 4,
        durationMs: 5,
      },
    ]);
    const right = jsonlLines([
      {
        schemaVersion: "0.1",
        event: "run_started",
        timestamp: 1,
        runId: "run_b",
        name: "n",
        startTime: 1,
      },
      {
        schemaVersion: "0.1",
        event: "step_started",
        timestamp: 2,
        runId: "run_b",
        stepId: "s",
        name: "step",
        type: "logic",
        startTime: 2,
        metadata: { outputPreview: "right" },
      },
      {
        schemaVersion: "0.1",
        event: "step_completed",
        timestamp: 3,
        runId: "run_b",
        stepId: "s",
        status: "success",
        endTime: 3,
        durationMs: 1,
      },
      {
        schemaVersion: "0.1",
        event: "run_completed",
        timestamp: 4,
        runId: "run_b",
        status: "success",
        endTime: 4,
        durationMs: 5,
      },
    ]);
    await writeFile(path.join(traceDir, "run_a.jsonl"), left, "utf-8");
    await writeFile(path.join(traceDir, "run_b.jsonl"), right, "utf-8");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await diffCommand("run_a", "run_b", { dir: traceDir, focus: "outputs" });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).toContain("output");
    logSpy.mockRestore();
  });

  it("--check structure filters comparison", async () => {
    await writeFile(path.join(traceDir, "run_a.jsonl"), traceSuccess("run_a", 20, 100), "utf-8");
    await writeFile(path.join(traceDir, "run_b.jsonl"), traceError("run_b"), "utf-8");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await diffCommand("run_a", "run_b", { dir: traceDir, check: "structure" });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).not.toContain("run-status");
    logSpy.mockRestore();
  });

  it("--check outputs filters comparison", async () => {
    await writeFile(path.join(traceDir, "run_a.jsonl"), traceSuccess("run_a", 20, 100), "utf-8");
    await writeFile(path.join(traceDir, "run_b.jsonl"), traceError("run_b"), "utf-8");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await diffCommand("run_a", "run_b", { dir: traceDir, check: "outputs" });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).toContain("(none)");
    logSpy.mockRestore();
  });

  it("--check errors filters comparison", async () => {
    await writeFile(
      path.join(traceDir, "run_a.jsonl"),
      traceSuccess("run_a", 10, 100),
      "utf-8",
    );
    await writeFile(
      path.join(traceDir, "run_b.jsonl"),
      traceSuccess("run_b", 99, 100),
      "utf-8",
    );
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await diffCommand("run_a", "run_b", { dir: traceDir, check: "errors" });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).toContain("(none)");
    logSpy.mockRestore();
  });

  it("--check timing shows duration differences only", async () => {
    await writeFile(
      path.join(traceDir, "run_a.jsonl"),
      traceSuccess("run_a", 10, 100),
      "utf-8",
    );
    await writeFile(
      path.join(traceDir, "run_b.jsonl"),
      traceSuccess("run_b", 50, 100),
      "utf-8",
    );
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await diffCommand("run_a", "run_b", { dir: traceDir, check: "timing" });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).toMatch(/duration/i);
    expect(out).not.toMatch(/step-status/);
    logSpy.mockRestore();
  });

  it("missing left run fails", async () => {
    await writeFile(path.join(traceDir, "run_b.jsonl"), traceSuccess("run_b", 20, 100), "utf-8");
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await diffCommand("missing", "run_b", { dir: traceDir });
    expect(process.exitCode).toBe(1);
    errSpy.mockRestore();
  });

  it("missing right run fails", async () => {
    await writeFile(path.join(traceDir, "run_a.jsonl"), traceSuccess("run_a", 20, 100), "utf-8");
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await diffCommand("run_a", "missing", { dir: traceDir });
    expect(process.exitCode).toBe(1);
    errSpy.mockRestore();
  });

  it("invalid duration threshold fails", async () => {
    await writeFile(path.join(traceDir, "run_a.jsonl"), traceSuccess("run_a", 20, 100), "utf-8");
    await writeFile(path.join(traceDir, "run_b.jsonl"), traceSuccess("run_b", 20, 100), "utf-8");
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await diffCommand("run_a", "run_b", {
      dir: traceDir,
      durationThreshold: "not-a-duration",
    });
    expect(process.exitCode).toBe(1);
    errSpy.mockRestore();
  });

  it("uses AGENT_INSPECT_TRACE_DIR when --dir omitted", async () => {
    process.env.AGENT_INSPECT_TRACE_DIR = traceDir;
    await writeFile(path.join(traceDir, "run_a.jsonl"), traceSuccess("run_a", 20, 100), "utf-8");
    await writeFile(path.join(traceDir, "run_b.jsonl"), traceSuccess("run_b", 20, 100), "utf-8");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await diffCommand("run_a", "run_b", {});
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it("--dir overrides AGENT_INSPECT_TRACE_DIR", async () => {
    const otherDir = path.join(os.tmpdir(), `agent-inspect-other-${Date.now()}`);
    await mkdir(otherDir, { recursive: true });
    try {
      process.env.AGENT_INSPECT_TRACE_DIR = otherDir;
      await writeFile(path.join(traceDir, "run_a.jsonl"), traceSuccess("run_a", 20, 100), "utf-8");
      await writeFile(path.join(traceDir, "run_b.jsonl"), traceSuccess("run_b", 20, 100), "utf-8");
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      await diffCommand("run_a", "run_b", { dir: traceDir });
      expect(logSpy).toHaveBeenCalled();
      logSpy.mockRestore();
    } finally {
      await rm(otherDir, { recursive: true, force: true });
    }
  });

  it("does not modify trace files", async () => {
    const p = path.join(traceDir, "run_a.jsonl");
    const content = traceSuccess("run_a", 20, 100);
    await writeFile(p, content, "utf-8");
    await writeFile(path.join(traceDir, "run_b.jsonl"), traceError("run_b"), "utf-8");
    const before = await readFile(p, "utf-8");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await diffCommand("run_a", "run_b", { dir: traceDir });
    const after = await readFile(p, "utf-8");
    expect(after).toBe(before);
    logSpy.mockRestore();
  });
});
