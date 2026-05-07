import { mkdir, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getCurrentRunId, hasActiveContext } from "../src/context.js";
import { inspectRun } from "../src/inspect-run.js";
import * as storage from "../src/storage.js";
import { MAX_NAME_LENGTH } from "../src/utils.js";

describe("inspectRun", () => {
  let traceDir: string;
  const prevEnv = process.env.AGENT_INSPECT_TRACE_DIR;

  beforeEach(async () => {
    traceDir = path.join(os.tmpdir(), `agent-inspect-ir-${Date.now()}`);
    await mkdir(traceDir, { recursive: true });
  });

  afterEach(async () => {
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
    vi.restoreAllMocks();
  });

  it("successful execution writes trace and completes", async () => {
    const result = await inspectRun(
      "test-run",
      async () => "result",
      { traceDir, silent: true },
    );
    expect(result).toBe("result");

    const files = await readdir(traceDir);
    const jsonl = files.filter((f) => f.endsWith(".jsonl"));
    expect(jsonl).toHaveLength(1);
    const runId = jsonl[0]!.replace(/\.jsonl$/, "");
    const events = await storage.readTraceEvents(runId, traceDir);
    expect(events.map((e) => e.event)).toEqual(["run_started", "run_completed"]);
    const done = events.find((e) => e.event === "run_completed");
    expect(done?.event === "run_completed" && done.status).toBe("success");
    if (done?.event === "run_completed") {
      expect(Number.isFinite(done.durationMs)).toBe(true);
    }
  });

  it("supports sync fn", async () => {
    const r = await inspectRun("sync-run", () => "sync-result", {
      traceDir,
      silent: true,
    });
    expect(r).toBe("sync-result");
  });

  it("rethrows original error and records run_completed error", async () => {
    const originalError = new Error("boom");
    await expect(
      inspectRun(
        "err-run",
        async () => {
          throw originalError;
        },
        { traceDir, silent: true },
      ),
    ).rejects.toBe(originalError);

    const files = await readdir(traceDir);
    const runId = files.find((f) => f.endsWith(".jsonl"))!.replace(/\.jsonl$/, "");
    const events = await storage.readTraceEvents(runId, traceDir);
    const done = events.find((e) => e.event === "run_completed");
    expect(done?.event === "run_completed" && done.status).toBe("error");
    if (done?.event === "run_completed" && done.error) {
      expect(done.error.message).toBe("boom");
    }
  });

  it("throws TypeError when fn is not a function", async () => {
    let caught: unknown;
    try {
      await inspectRun(
        "bad",
        undefined as unknown as () => string,
        { traceDir, silent: true },
      );
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(TypeError);
    const msg = String((caught as Error).message);
    expect(msg).toMatch(/inspectRun/i);
    expect(msg).toMatch(/function/i);
  });

  it("normalizes blank name to unnamed-run in trace", async () => {
    await inspectRun("", async () => "ok", { traceDir, silent: true });
    const files = await readdir(traceDir);
    const runId = files.find((f) => f.endsWith(".jsonl"))!.replace(/\.jsonl$/, "");
    const events = await storage.readTraceEvents(runId, traceDir);
    const start = events.find((e) => e.event === "run_started");
    expect(start?.event === "run_started" && start.name).toBe("unnamed-run");
  });

  it("includes metadata on run_started", async () => {
    await inspectRun(
      "meta-run",
      async () => "ok",
      {
        traceDir,
        silent: true,
        metadata: { environment: "test" },
      },
    );
    const files = await readdir(traceDir);
    const runId = files.find((f) => f.endsWith(".jsonl"))!.replace(/\.jsonl$/, "");
    const events = await storage.readTraceEvents(runId, traceDir);
    const start = events.find((e) => e.event === "run_started");
    expect(start?.event === "run_started" && start.metadata).toEqual({
      environment: "test",
    });
  });

  it("uses custom traceDir", async () => {
    const sub = path.join(traceDir, "nested");
    await mkdir(sub, { recursive: true });
    await inspectRun("t", async () => 1, { traceDir: sub, silent: true });
    const files = await readdir(sub);
    expect(files.some((f) => f.endsWith(".jsonl"))).toBe(true);
  });

  it("silent mode avoids console.log from AgentInspect prints", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await inspectRun("quiet", async () => {}, { traceDir, silent: true });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("non-silent prints header and completion", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await inspectRun("loud", async () => "x", { traceDir, silent: false });
    const joined = spy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(joined).toContain("AgentInspect");
    expect(joined).toContain("🔍");
    expect(joined).toContain("Completed in");
    expect(joined).toContain("Trace:");
    spy.mockRestore();
  });

  it("exposes run id inside fn matching trace", async () => {
    const rid = await inspectRun(
      "ctx",
      async () => getCurrentRunId(),
      { traceDir, silent: true },
    );
    expect(typeof rid).toBe("string");
    const events = await storage.readTraceEvents(String(rid), traceDir);
    expect(events[0]?.event === "run_started" && events[0].runId).toBe(rid);
  });

  it("clears context after completion", async () => {
    await inspectRun("c", async () => {}, { traceDir, silent: true });
    expect(hasActiveContext()).toBe(false);
  });

  it("nested inspectRun uses independent run ids and restores outer context", async () => {
    const outer = await inspectRun(
      "outer",
      async () => {
        const outerId = getCurrentRunId();
        const inner = await inspectRun(
          "inner",
          async () => getCurrentRunId(),
          { traceDir, silent: true },
        );
        expect(inner).not.toBe(outerId);
        expect(getCurrentRunId()).toBe(outerId);
        return "done";
      },
      { traceDir, silent: true },
    );
    expect(outer).toBe("done");
    const files = (await readdir(traceDir)).filter((f) => f.endsWith(".jsonl"));
    expect(files.length).toBeGreaterThanOrEqual(2);
  });

  it("returns user result when storage writes fail", async () => {
    vi.spyOn(storage, "writeTraceEvent").mockImplementation(() =>
      Promise.reject(new Error("storage down")),
    );
    const r = await inspectRun("res", async () => "still-ok", {
      traceDir,
      silent: true,
    });
    expect(r).toBe("still-ok");
  });

  it("returns user result when console.log throws", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {
      throw new Error("log broken");
    });
    const r = await inspectRun("t", async () => 42, {
      traceDir,
      silent: false,
    });
    expect(r).toBe(42);
  });

  it("truncates long run name in trace", async () => {
    const long = "x".repeat(MAX_NAME_LENGTH + 50);
    await inspectRun(long, async () => null, { traceDir, silent: true });
    const files = await readdir(traceDir);
    const runId = files.find((f) => f.endsWith(".jsonl"))!.replace(/\.jsonl$/, "");
    const events = await storage.readTraceEvents(runId, traceDir);
    const start = events.find((e) => e.event === "run_started");
    expect(start?.event).toBe("run_started");
    if (start?.event === "run_started") {
      expect(start.name.endsWith("...")).toBe(true);
      expect(start.name.length).toBe(MAX_NAME_LENGTH);
    }
  });

  it("writes to AGENT_INSPECT_TRACE_DIR when traceDir option is missing", async () => {
    const envDir = path.join(os.tmpdir(), `agent-inspect-ir-env-${Date.now()}`);
    await mkdir(envDir, { recursive: true });
    process.env.AGENT_INSPECT_TRACE_DIR = envDir;

    await inspectRun("env-run", async () => "ok", { silent: true });

    const files = await readdir(envDir);
    expect(files.some((f) => f.endsWith(".jsonl"))).toBe(true);
    await rm(envDir, { recursive: true, force: true });
  });

  it("traceDir option wins over AGENT_INSPECT_TRACE_DIR", async () => {
    const envDir = path.join(os.tmpdir(), `agent-inspect-ir-env-${Date.now()}`);
    await mkdir(envDir, { recursive: true });
    process.env.AGENT_INSPECT_TRACE_DIR = envDir;

    await inspectRun("explicit-run", async () => "ok", { traceDir, silent: true });

    const envFiles = await readdir(envDir);
    const explicitFiles = await readdir(traceDir);
    expect(envFiles.filter((f) => f.endsWith(".jsonl"))).toHaveLength(0);
    expect(explicitFiles.filter((f) => f.endsWith(".jsonl")).length).toBeGreaterThan(0);
    await rm(envDir, { recursive: true, force: true });
  });
});
