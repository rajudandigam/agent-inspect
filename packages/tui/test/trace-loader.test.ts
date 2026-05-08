import { mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { loadTraceForTui } from "../src/trace-loader.js";

function jsonl(...lines: string[]): string {
  return lines.join("\n") + "\n";
}

describe("loadTraceForTui", () => {
  let traceDir: string;
  let otherDir: string;
  const prevEnv = process.env.AGENT_INSPECT_TRACE_DIR;

  beforeEach(async () => {
    traceDir = path.join(os.tmpdir(), `agent-inspect-tui-load-${Date.now()}`);
    otherDir = path.join(os.tmpdir(), `agent-inspect-tui-other-${Date.now()}`);
    await mkdir(traceDir, { recursive: true });
    await mkdir(otherDir, { recursive: true });
    delete process.env.AGENT_INSPECT_TRACE_DIR;
  });

  afterEach(async () => {
    try {
      await rm(traceDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
    try {
      await rm(otherDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
    if (prevEnv === undefined) {
      delete process.env.AGENT_INSPECT_TRACE_DIR;
    } else {
      process.env.AGENT_INSPECT_TRACE_DIR = prevEnv;
    }
  });

  it("loads trace by runId from explicit dir", async () => {
    const runId = "run_load";
    const body = jsonl(
      `{"schemaVersion":"0.1","event":"run_started","timestamp":1,"runId":"${runId}","name":"n","startTime":1}`,
      `{"schemaVersion":"0.1","event":"run_completed","timestamp":2,"runId":"${runId}","status":"success","endTime":2,"durationMs":1}`,
    );
    await writeFile(path.join(traceDir, `${runId}.jsonl`), body, "utf-8");
    const m = await loadTraceForTui({ runId, dir: traceDir });
    expect(m.runId).toBe(runId);
    expect(m.name).toBe("n");
    expect(m.status).toBe("success");
    expect(m.nodes).toHaveLength(0);
  });

  it("supports AGENT_INSPECT_TRACE_DIR", async () => {
    process.env.AGENT_INSPECT_TRACE_DIR = traceDir;
    const runId = "run_env";
    const body = jsonl(
      `{"schemaVersion":"0.1","event":"run_started","timestamp":1,"runId":"${runId}","name":"env","startTime":1}`,
      `{"schemaVersion":"0.1","event":"run_completed","timestamp":2,"runId":"${runId}","status":"success","endTime":2,"durationMs":1}`,
    );
    await writeFile(path.join(traceDir, `${runId}.jsonl`), body, "utf-8");
    const m = await loadTraceForTui({ runId });
    expect(m.runId).toBe(runId);
    expect(m.name).toBe("env");
  });

  it("explicit dir wins over env", async () => {
    const runId = "run_win";
    const body = jsonl(
      `{"schemaVersion":"0.1","event":"run_started","timestamp":1,"runId":"${runId}","name":"explicit","startTime":1}`,
      `{"schemaVersion":"0.1","event":"run_completed","timestamp":2,"runId":"${runId}","status":"success","endTime":2,"durationMs":1}`,
    );
    await writeFile(path.join(traceDir, `${runId}.jsonl`), body, "utf-8");
    process.env.AGENT_INSPECT_TRACE_DIR = otherDir;
    const m = await loadTraceForTui({ runId, dir: traceDir });
    expect(m.name).toBe("explicit");
  });

  it("fails clearly when trace missing or empty", async () => {
    await expect(loadTraceForTui({ runId: "nope", dir: traceDir })).rejects.toThrow(
      /empty|not found/i,
    );
  });

  it("fails when trace has no valid events", async () => {
    const runId = "run_badlines";
    await writeFile(path.join(traceDir, `${runId}.jsonl`), "not-json\n", "utf-8");
    await expect(loadTraceForTui({ runId, dir: traceDir })).rejects.toThrow();
  });

  it("returns model with steps", async () => {
    const runId = "run_steps";
    const body = jsonl(
      `{"schemaVersion":"0.1","event":"run_started","timestamp":1,"runId":"${runId}","name":"with-steps","startTime":1}`,
      `{"schemaVersion":"0.1","event":"step_started","timestamp":10,"runId":"${runId}","stepId":"s1","name":"a","type":"logic","startTime":10}`,
      `{"schemaVersion":"0.1","event":"step_completed","timestamp":20,"runId":"${runId}","stepId":"s1","status":"success","endTime":20,"durationMs":10}`,
      `{"schemaVersion":"0.1","event":"run_completed","timestamp":30,"runId":"${runId}","status":"success","endTime":30,"durationMs":29}`,
    );
    await writeFile(path.join(traceDir, `${runId}.jsonl`), body, "utf-8");
    const m = await loadTraceForTui({ runId, dir: traceDir });
    expect(m.nodes).toHaveLength(1);
    expect(m.nodes[0]!.name).toBe("a");
  });

  it("fails when trace has valid rows but no run_started", async () => {
    const runId = "run_nostart";
    const body = jsonl(
      `{"schemaVersion":"0.1","event":"step_started","timestamp":10,"runId":"${runId}","stepId":"s1","name":"orphan","type":"logic","startTime":10}`,
      `{"schemaVersion":"0.1","event":"step_completed","timestamp":20,"runId":"${runId}","stepId":"s1","status":"success","endTime":20,"durationMs":10}`,
    );
    await writeFile(path.join(traceDir, `${runId}.jsonl`), body, "utf-8");
    await expect(loadTraceForTui({ runId, dir: traceDir })).rejects.toThrow(/run_started/);
  });
});
