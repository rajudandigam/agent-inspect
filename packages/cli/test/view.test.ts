import { mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockRunTraceViewer } = vi.hoisted(() => ({
  mockRunTraceViewer: vi.fn(async () => {}),
}));

vi.mock("@agent-inspect/tui", () => ({
  runTraceViewer: mockRunTraceViewer,
}));

import * as core from "@agent-inspect/core";

import { view } from "../src/view.js";

function jsonl(...lines: string[]): string {
  return lines.join("\n") + "\n";
}

function runStarted(
  runId: string,
  name: string,
  startTime: number,
  timestamp: number,
): string {
  return JSON.stringify({
    schemaVersion: "0.1",
    event: "run_started",
    timestamp,
    runId,
    name,
    startTime,
  });
}

function runCompleted(
  runId: string,
  status: "success" | "error",
  endTime: number,
  durationMs: number,
  error?: { message: string; stack?: string },
): string {
  return JSON.stringify({
    schemaVersion: "0.1",
    event: "run_completed",
    timestamp: endTime,
    runId,
    status,
    endTime,
    durationMs,
    ...(error !== undefined ? { error } : {}),
  });
}

function stepStarted(
  runId: string,
  stepId: string,
  name: string,
  startTime: number,
  parentId?: string,
): string {
  return JSON.stringify({
    schemaVersion: "0.1",
    event: "step_started",
    timestamp: startTime,
    runId,
    stepId,
    name,
    type: "logic",
    startTime,
    ...(parentId !== undefined ? { parentId } : {}),
  });
}

function stepCompleted(
  runId: string,
  stepId: string,
  status: "success" | "error",
  endTime: number,
  durationMs: number,
  error?: { message: string; stack?: string },
): string {
  return JSON.stringify({
    schemaVersion: "0.1",
    event: "step_completed",
    timestamp: endTime,
    runId,
    stepId,
    status,
    endTime,
    durationMs,
    ...(error !== undefined ? { error } : {}),
  });
}

describe("view", () => {
  let traceDir: string;
  const prevEnv = process.env.AGENT_INSPECT_TRACE_DIR;

  beforeEach(async () => {
    traceDir = path.join(os.tmpdir(), `agent-inspect-cli-view-${Date.now()}`);
    await mkdir(traceDir, { recursive: true });
    delete process.env.AGENT_INSPECT_TRACE_DIR;
    mockRunTraceViewer.mockClear();
    mockRunTraceViewer.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    process.exitCode = 0;
    vi.restoreAllMocks();
    try {
      await rm(traceDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
    if (prevEnv === undefined) {
      delete process.env.AGENT_INSPECT_TRACE_DIR;
    } else {
      process.env.AGENT_INSPECT_TRACE_DIR = prevEnv;
    }
  });

  it("handles missing run", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await view("run_missing", { dir: traceDir });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).toContain("Run not found");
    expect(out).toContain(traceDir);
    expect(process.exitCode).toBe(1);
    logSpy.mockRestore();
  });

  it("renders execution tree", async () => {
    const runId = "run_tree";
    const body = jsonl(
      runStarted(runId, "root-run", 1, 1),
      stepStarted(runId, "step_p", "parent-step", 10),
      stepStarted(runId, "step_c", "child-step", 20, "step_p"),
      stepCompleted(runId, "step_c", "success", 30, 10),
      stepCompleted(runId, "step_p", "success", 40, 30),
      runCompleted(runId, "success", 50, 49),
    );
    await writeFile(path.join(traceDir, `${runId}.jsonl`), body, "utf-8");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await view(runId, { dir: traceDir });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).toContain("AgentInspect Run");
    expect(out).toContain("Execution Tree");
    expect(out).toContain("parent-step");
    expect(out).toContain("child-step");
    expect(out).toContain("Trace file:");
    logSpy.mockRestore();
  });

  it("renders failed step with error message", async () => {
    const runId = "run_failstep";
    const body = jsonl(
      runStarted(runId, "r", 1, 1),
      stepStarted(runId, "step_x", "flaky", 10),
      stepCompleted(runId, "step_x", "error", 20, 10, {
        message: "step broke",
      }),
      runCompleted(runId, "error", 30, 29, { message: "run failed" }),
    );
    await writeFile(path.join(traceDir, `${runId}.jsonl`), body, "utf-8");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await view(runId, { dir: traceDir });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).toMatch(/✖|Error:/);
    expect(out).toContain("Error:");
    expect(out).toContain("step broke");
    logSpy.mockRestore();
  });

  it("verbose includes stack when present", async () => {
    const runId = "run_verbose";
    const stack = "Error: inner\n  at foo (file.ts:1:1)";
    const body = jsonl(
      runStarted(runId, "r", 1, 1),
      stepStarted(runId, "step_x", "s", 10),
      stepCompleted(runId, "step_x", "error", 20, 10, {
        message: "m",
        stack,
      }),
      runCompleted(runId, "success", 30, 29),
    );
    await writeFile(path.join(traceDir, `${runId}.jsonl`), body, "utf-8");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await view(runId, { dir: traceDir, verbose: true });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).toContain("at foo");
    logSpy.mockRestore();
  });

  it("json mode prints parseable events", async () => {
    const runId = "run_json";
    const body = jsonl(
      runStarted(runId, "j", 1, 1),
      runCompleted(runId, "success", 2, 1),
    );
    await writeFile(path.join(traceDir, `${runId}.jsonl`), body, "utf-8");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await view(runId, { dir: traceDir, json: true });
    const raw = String(logSpy.mock.calls[0]?.[0] ?? "");
    const parsed = JSON.parse(raw) as unknown[];
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(2);
    logSpy.mockRestore();
  });

  it("--summary prints a run summary", async () => {
    const runId = "run_summary";
    const body = jsonl(
      runStarted(runId, "s", 1, 1),
      stepStarted(runId, "step_a", "a", 10),
      stepCompleted(runId, "step_a", "success", 20, 10),
      stepStarted(runId, "step_b", "b", 30),
      stepCompleted(runId, "step_b", "error", 40, 10, { message: "bad" }),
      runCompleted(runId, "error", 50, 49, { message: "run failed" }),
    );
    await writeFile(path.join(traceDir, `${runId}.jsonl`), body, "utf-8");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await view(runId, { dir: traceDir, summary: true });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).toContain("Run Summary");
    expect(out).toContain("Total steps:");
    expect(out).toContain("Error steps:");
    expect(out).toContain("Max depth:");
    logSpy.mockRestore();
  });

  it("--json --summary prints parseable JSON", async () => {
    const runId = "run_summary_json";
    const body = jsonl(runStarted(runId, "s", 1, 1), runCompleted(runId, "success", 2, 1));
    await writeFile(path.join(traceDir, `${runId}.jsonl`), body, "utf-8");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await view(runId, { dir: traceDir, summary: true, json: true });
    const raw = String(logSpy.mock.calls[0]?.[0] ?? "");
    const parsed = JSON.parse(raw) as unknown;
    expect(parsed && typeof parsed === "object").toBe(true);
    logSpy.mockRestore();
  });

  it("--metadata prints trace metadata", async () => {
    const runId = "run_meta";
    const body = jsonl(runStarted(runId, "m", 1, 1), runCompleted(runId, "success", 2, 1));
    await writeFile(path.join(traceDir, `${runId}.jsonl`), body, "utf-8");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await view(runId, { dir: traceDir, metadata: true });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).toContain("Trace Metadata");
    expect(out).toContain("File path:");
    expect(out).toContain("Event count:");
    logSpy.mockRestore();
  });

  it("--errors-only shows only error events", async () => {
    const runId = "run_errors_only";
    const body = jsonl(
      runStarted(runId, "e", 1, 1),
      stepStarted(runId, "step_ok", "ok", 10),
      stepCompleted(runId, "step_ok", "success", 20, 10),
      stepStarted(runId, "step_bad", "bad", 30),
      stepCompleted(runId, "step_bad", "error", 40, 10, { message: "oops" }),
      runCompleted(runId, "error", 50, 49, { message: "run failed" }),
    );
    await writeFile(path.join(traceDir, `${runId}.jsonl`), body, "utf-8");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await view(runId, { dir: traceDir, errorsOnly: true });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).toContain("Error events");
    expect(out).toContain("step_completed");
    expect(out).not.toContain("step_ok");
    logSpy.mockRestore();
  });

  it("--errors-only prints helpful message when no errors", async () => {
    const runId = "run_no_errors";
    const body = jsonl(runStarted(runId, "ok", 1, 1), runCompleted(runId, "success", 2, 1));
    await writeFile(path.join(traceDir, `${runId}.jsonl`), body, "utf-8");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await view(runId, { dir: traceDir, errorsOnly: true });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).toContain("No errors found");
    logSpy.mockRestore();
  });

  it("AGENT_INSPECT_TRACE_DIR is used when --dir missing", async () => {
    process.env.AGENT_INSPECT_TRACE_DIR = traceDir;
    const runId = "run_env_view";
    const body = jsonl(runStarted(runId, "env", 1, 1), runCompleted(runId, "success", 2, 1));
    await writeFile(path.join(traceDir, `${runId}.jsonl`), body, "utf-8");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await view(runId, {});
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).toContain("AgentInspect Run");
    logSpy.mockRestore();
  });

  it("--dir overrides AGENT_INSPECT_TRACE_DIR", async () => {
    const otherDir = path.join(os.tmpdir(), `agent-inspect-cli-view-other-${Date.now()}`);
    await mkdir(otherDir, { recursive: true });
    process.env.AGENT_INSPECT_TRACE_DIR = otherDir;

    const runId = "run_dir_override";
    const body = jsonl(runStarted(runId, "dir", 1, 1), runCompleted(runId, "success", 2, 1));
    await writeFile(path.join(traceDir, `${runId}.jsonl`), body, "utf-8");

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await view(runId, { dir: traceDir });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).toContain("AgentInspect Run");
    logSpy.mockRestore();

    await rm(otherDir, { recursive: true, force: true });
  });

  it("shows no steps when trace has only run events", async () => {
    const runId = "run_nosteps";
    const body = jsonl(
      runStarted(runId, "empty", 1, 1),
      runCompleted(runId, "success", 2, 1),
    );
    await writeFile(path.join(traceDir, `${runId}.jsonl`), body, "utf-8");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await view(runId, { dir: traceDir });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).toContain("No steps recorded");
    logSpy.mockRestore();
  });

  it("rejects trace without run_started", async () => {
    const runId = "run_invalid";
    const body = jsonl(
      stepStarted(runId, "step_x", "orphan", 10),
      stepCompleted(runId, "step_x", "success", 20, 10),
    );
    await writeFile(path.join(traceDir, `${runId}.jsonl`), body, "utf-8");
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await view(runId, { dir: traceDir });
    expect(errSpy.mock.calls.some((c) => String(c[0]).includes("Invalid trace"))).toBe(
      true,
    );
    expect(process.exitCode).toBe(1);
    errSpy.mockRestore();
  });

  it("sets exit code when readTraceEvents fails unexpectedly", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(core, "readTraceEvents").mockRejectedValueOnce(new Error("io"));
    await view("run_x", { dir: traceDir });
    expect(process.exitCode).toBe(1);
    expect(errSpy.mock.calls.some((c) => String(c[0]).includes("view failed"))).toBe(
      true,
    );
    errSpy.mockRestore();
  });

  it("requires run id", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await view("   ", { dir: traceDir });
    expect(errSpy.mock.calls.some((c) => String(c[0]).includes("Run id is required"))).toBe(
      true,
    );
    expect(process.exitCode).toBe(1);
    errSpy.mockRestore();
  });

  it("--tui delegates to optional TUI package", async () => {
    await view("run_tui_delegate", { tui: true, dir: traceDir });
    expect(mockRunTraceViewer).toHaveBeenCalledWith({
      runId: "run_tui_delegate",
      dir: traceDir,
    });
  });

  it("--tui cannot combine with --json", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await view("run_x", { tui: true, json: true, dir: traceDir });
    expect(
      errSpy.mock.calls.some((c) =>
        String(c[0]).includes("--tui cannot be combined"),
      ),
    ).toBe(true);
    expect(process.exitCode).toBe(1);
    expect(mockRunTraceViewer).not.toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it("--tui cannot combine with --summary", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await view("run_x", { tui: true, summary: true, dir: traceDir });
    expect(process.exitCode).toBe(1);
    expect(mockRunTraceViewer).not.toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it("--tui cannot combine with --metadata", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await view("run_x", { tui: true, metadata: true, dir: traceDir });
    expect(process.exitCode).toBe(1);
    expect(mockRunTraceViewer).not.toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it("--tui cannot combine with --errors-only", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await view("run_x", { tui: true, errorsOnly: true, dir: traceDir });
    expect(process.exitCode).toBe(1);
    expect(mockRunTraceViewer).not.toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it("prints TUI terminal message when runTraceViewer throws", async () => {
    mockRunTraceViewer.mockRejectedValueOnce(
      new Error(
        "TUI requires an interactive terminal. Use agent-inspect view without --tui for plain output.",
      ),
    );
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await view("run_tty", { tui: true, dir: traceDir });
    expect(errSpy.mock.calls.some((c) => String(c[0]).includes("interactive terminal"))).toBe(
      true,
    );
    expect(process.exitCode).toBe(1);
    errSpy.mockRestore();
  });
});
