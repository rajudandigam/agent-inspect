import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { exportCommand } from "../src/export.js";

function jsonl(runId: string): string {
  return [
    JSON.stringify({
      schemaVersion: "0.1",
      event: "run_started",
      timestamp: 1,
      runId,
      name: "ex",
      startTime: 1,
    }),
    JSON.stringify({
      schemaVersion: "0.1",
      event: "run_completed",
      timestamp: 2,
      runId,
      status: "success",
      endTime: 2,
      durationMs: 1,
    }),
    "",
  ].join("\n");
}

describe("export CLI", () => {
  let traceDir: string;
  const prevEnv = process.env.AGENT_INSPECT_TRACE_DIR;

  beforeEach(async () => {
    traceDir = path.join(os.tmpdir(), `agent-inspect-cli-export-${Date.now()}`);
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

  it("exports markdown to stdout", async () => {
    const runId = "run_out";
    await writeFile(path.join(traceDir, `${runId}.jsonl`), jsonl(runId), "utf-8");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await exportCommand(runId, { dir: traceDir, format: "markdown" });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).toContain("# AgentInspect Run:");
    logSpy.mockRestore();
  });

  it("writes output file and creates parent dir", async () => {
    const runId = "run_file";
    await writeFile(path.join(traceDir, `${runId}.jsonl`), jsonl(runId), "utf-8");
    const nested = path.join(traceDir, "nested", "out.md");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await exportCommand(runId, {
      dir: traceDir,
      format: "markdown",
      output: nested,
    });
    const txt = await readFile(nested, "utf-8");
    expect(txt).toContain("# AgentInspect Run:");
    logSpy.mockRestore();
  });

  it("--json wrapper parseable", async () => {
    const runId = "run_json";
    await writeFile(path.join(traceDir, `${runId}.jsonl`), jsonl(runId), "utf-8");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await exportCommand(runId, { dir: traceDir, format: "openinference", json: true });
    const raw = String(logSpy.mock.calls[0]?.[0] ?? "");
    const parsed = JSON.parse(raw) as { format: string; content?: string };
    expect(parsed.format).toBe("openinference");
    expect(parsed.content).toBeDefined();
    logSpy.mockRestore();
  });

  it("--validate succeeds", async () => {
    const runId = "run_val";
    await writeFile(path.join(traceDir, `${runId}.jsonl`), jsonl(runId), "utf-8");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await exportCommand(runId, { dir: traceDir, format: "markdown", validate: true });
    expect(process.exitCode ?? 0).toBe(0);
    logSpy.mockRestore();
    errSpy.mockRestore();
  });

  it("missing run fails", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await exportCommand("run_missing", { dir: traceDir, format: "markdown" });
    expect(process.exitCode).toBe(1);
    errSpy.mockRestore();
  });

  it("accepts --redaction-profile share", async () => {
    const runId = "run_share_prof";
    const lines = [
      JSON.stringify({
        schemaVersion: "0.1",
        event: "run_started",
        timestamp: 1,
        runId,
        name: "ex",
        startTime: 1,
      }),
      JSON.stringify({
        schemaVersion: "0.1",
        event: "step_started",
        timestamp: 2,
        runId,
        stepId: "s1",
        name: "step",
        type: "logic",
        startTime: 2,
        metadata: { correlationId: "corr-cli", customerId: "cust-cli" },
      }),
      JSON.stringify({
        schemaVersion: "0.1",
        event: "step_completed",
        timestamp: 3,
        runId,
        stepId: "s1",
        status: "success",
        endTime: 3,
        durationMs: 1,
      }),
      JSON.stringify({
        schemaVersion: "0.1",
        event: "run_completed",
        timestamp: 4,
        runId,
        status: "success",
        endTime: 4,
        durationMs: 3,
      }),
      "",
    ].join("\n");
    await writeFile(path.join(traceDir, `${runId}.jsonl`), lines, "utf-8");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await exportCommand(runId, {
      dir: traceDir,
      format: "markdown",
      includeAttributes: true,
      redactionProfile: "share",
    });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out).toContain("[REDACTED]");
    expect(out).not.toContain("corr-cli");
    logSpy.mockRestore();
  });

  it("rejects invalid --redaction-profile", async () => {
    const runId = "run_bad_prof";
    await writeFile(path.join(traceDir, `${runId}.jsonl`), jsonl(runId), "utf-8");
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await exportCommand(runId, {
      dir: traceDir,
      format: "markdown",
      redactionProfile: "ultra",
    });
    expect(process.exitCode).toBe(1);
    expect(errSpy.mock.calls.map((c) => String(c[0])).join("\n")).toMatch(
      /redaction-profile/i,
    );
    errSpy.mockRestore();
  });

  it("uses AGENT_INSPECT_TRACE_DIR", async () => {
    const runId = "run_env_ex";
    await writeFile(path.join(traceDir, `${runId}.jsonl`), jsonl(runId), "utf-8");
    process.env.AGENT_INSPECT_TRACE_DIR = traceDir;
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await exportCommand(runId, { format: "html" });
    const out = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(out.toLowerCase()).toContain("<!doctype html");
    logSpy.mockRestore();
  });
});
