import {
  access,
  appendFile,
  mkdir,
  readFile,
  rm,
  utimes,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { TraceEvent } from "../src/types.js";
import {
  getRunIdFromTraceFileName,
  initializeTraceFile,
  listTraceFiles,
  readTraceEvents,
  readTraceFile,
  serializeEvent,
  validateEvent,
  writeTraceEvent,
} from "../src/storage.js";

const ts = 1_700_000_000_000;

function runStarted(
  overrides: Partial<{
    runId: string;
    name: string;
    startTime: number;
    timestamp: number;
  }> = {},
): TraceEvent {
  return {
    schemaVersion: "0.1",
    event: "run_started",
    timestamp: ts,
    runId: "run_valid1",
    name: "n",
    startTime: ts,
    ...overrides,
  };
}

describe("serializeEvent", () => {
  it("serializes run_started and round-trips without trailing newline", () => {
    const ev = runStarted({ runId: "run_a", name: "agent" });
    const s = serializeEvent(ev);
    expect(s.endsWith("\n")).toBe(false);
    const parsed = JSON.parse(s) as TraceEvent;
    expect(parsed).toEqual(ev);
  });
});

describe("validateEvent", () => {
  it("accepts run_started", () => {
    expect(validateEvent(runStarted())).toBe(true);
  });

  it("accepts run_completed success and error", () => {
    const ok: TraceEvent = {
      schemaVersion: "0.1",
      event: "run_completed",
      timestamp: ts,
      runId: "run_x",
      status: "success",
      endTime: ts + 1,
      durationMs: 1,
    };
    const err: TraceEvent = {
      schemaVersion: "0.1",
      event: "run_completed",
      timestamp: ts,
      runId: "run_x",
      status: "error",
      endTime: ts + 1,
      durationMs: 1,
      error: { message: "m" },
    };
    expect(validateEvent(ok)).toBe(true);
    expect(validateEvent(err)).toBe(true);
  });

  it("accepts step_started with parentId", () => {
    const ev: TraceEvent = {
      schemaVersion: "0.1",
      event: "step_started",
      timestamp: ts,
      runId: "run_x",
      stepId: "step_a",
      parentId: "step_root",
      name: "child",
      type: "logic",
      startTime: ts,
    };
    expect(validateEvent(ev)).toBe(true);
  });

  it("accepts step_completed success and error", () => {
    const ok: TraceEvent = {
      schemaVersion: "0.1",
      event: "step_completed",
      timestamp: ts,
      runId: "run_x",
      stepId: "step_a",
      status: "success",
      endTime: ts + 1,
      durationMs: 1,
    };
    const err: TraceEvent = {
      schemaVersion: "0.1",
      event: "step_completed",
      timestamp: ts,
      runId: "run_x",
      stepId: "step_a",
      status: "error",
      endTime: ts + 1,
      durationMs: 1,
      error: { message: "e" },
    };
    expect(validateEvent(ok)).toBe(true);
    expect(validateEvent(err)).toBe(true);
  });

  it("rejects invalid payloads", () => {
    expect(validateEvent({ event: "run_started" })).toBe(false);
    expect(validateEvent({ ...runStarted(), schemaVersion: "0.2" })).toBe(false);
    expect(validateEvent({ ...runStarted(), timestamp: Number.NaN })).toBe(
      false,
    );
    expect(validateEvent({ ...runStarted(), event: "step_failed" })).toBe(false);
    expect(validateEvent({ ...runStarted(), runId: "" })).toBe(false);
    expect(
      validateEvent({
        schemaVersion: "0.1",
        event: "step_started",
        timestamp: ts,
        runId: "r",
        stepId: "",
        name: "n",
        type: "logic",
        startTime: ts,
      }),
    ).toBe(false);
    expect(
      validateEvent({
        schemaVersion: "0.1",
        event: "step_started",
        timestamp: ts,
        runId: "r",
        stepId: "s",
        name: "n",
        type: "invalid",
        startTime: ts,
      }),
    ).toBe(false);
    expect(
      validateEvent({
        schemaVersion: "0.1",
        event: "step_completed",
        timestamp: ts,
        runId: "r",
        stepId: "s",
        status: "running",
        endTime: ts,
        durationMs: 1,
      }),
    ).toBe(false);
    expect(validateEvent("x")).toBe(false);
    expect(validateEvent(null)).toBe(false);
    expect(validateEvent(undefined)).toBe(false);
  });
});

describe("initializeTraceFile", () => {
  let dir: string;

  beforeEach(async () => {
    dir = path.join(os.tmpdir(), `agent-inspect-storage-${Date.now()}`);
    await mkdir(dir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await rm(dir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  });

  it("creates directory and empty jsonl and returns path", async () => {
    const p = await initializeTraceFile("run_init", dir);
    expect(p).toBe(path.join(path.resolve(dir), "run_init.jsonl"));
    await expect(access(p!)).resolves.toBeUndefined();
    const content = await readFile(p!, "utf-8");
    expect(content).toBe("");
  });

  it("is safe to call twice (truncates)", async () => {
    const p1 = await initializeTraceFile("run_twice", dir);
    await appendFile(p1!, "garbage\n", "utf-8");
    const p2 = await initializeTraceFile("run_twice", dir);
    expect(p1).toBe(p2);
    const content = await readFile(p2!, "utf-8");
    expect(content).toBe("");
  });

  it("does not throw when traceDir is a file path and may use fallback", async () => {
    const fileBlocking = path.join(dir, "not-a-dir");
    await writeFile(fileBlocking, "block");
    const p = await initializeTraceFile("run_x", fileBlocking);
    expect(p === undefined || p.endsWith(".jsonl")).toBe(true);
  });
});

describe("writeTraceEvent", () => {
  let dir: string;

  beforeEach(async () => {
    dir = path.join(os.tmpdir(), `agent-inspect-write-${Date.now()}`);
    await mkdir(dir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await rm(dir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  });

  it("appends valid events as JSONL lines", async () => {
    await initializeTraceFile("run_w", dir);
    const e1 = runStarted({ runId: "run_w", name: "a" });
    const e2: TraceEvent = {
      schemaVersion: "0.1",
      event: "run_completed",
      timestamp: ts,
      runId: "run_w",
      status: "success",
      endTime: ts + 1,
      durationMs: 1,
    };
    await writeTraceEvent(e1, dir);
    await writeTraceEvent(e2, dir);
    const raw = await readFile(path.join(dir, "run_w.jsonl"), "utf-8");
    const lines = raw.trim().split("\n");
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0])).toEqual(e1);
    expect(JSON.parse(lines[1])).toEqual(e2);
  });

  it("skips invalid events without throwing", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    await initializeTraceFile("run_inv", dir);
    await writeTraceEvent({ ...runStarted(), runId: "" } as TraceEvent, dir);
    const raw = await readFile(path.join(dir, "run_inv.jsonl"), "utf-8");
    expect(raw.trim()).toBe("");
    warnSpy.mockRestore();
  });

  it("handles concurrent writes", async () => {
    await initializeTraceFile("run_conc", dir);
    await Promise.all([
      writeTraceEvent(
        runStarted({ runId: "run_conc", name: "x", startTime: ts }),
        dir,
      ),
      writeTraceEvent(
        {
          schemaVersion: "0.1",
          event: "run_completed",
          timestamp: ts + 1,
          runId: "run_conc",
          status: "success",
          endTime: ts + 2,
          durationMs: 1,
        },
        dir,
      ),
    ]);
    const events = await readTraceEvents("run_conc", dir);
    expect(events.length).toBe(2);
  });

  it("does not throw when directory is missing (creates via ensureTraceDir)", async () => {
    const nested = path.join(dir, "deep", "sub");
    await writeTraceEvent(runStarted({ runId: "run_newdir", name: "n" }), nested);
    const events = await readTraceEvents("run_newdir", nested);
    expect(events.length).toBeGreaterThanOrEqual(1);
  });
});

describe("readTraceFile", () => {
  let dir: string;

  beforeEach(async () => {
    dir = path.join(os.tmpdir(), `agent-inspect-read-${Date.now()}`);
    await mkdir(dir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await rm(dir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  });

  it("reads existing content", async () => {
    const fp = path.join(dir, "run_r.jsonl");
    await writeFile(fp, "hello", "utf-8");
    const content = await readTraceFile("run_r", dir);
    expect(content).toBe("hello");
  });

  it("returns undefined for missing file", async () => {
    expect(await readTraceFile("run_missing", dir)).toBeUndefined();
  });
});

describe("readTraceEvents", () => {
  let dir: string;

  beforeEach(async () => {
    dir = path.join(os.tmpdir(), `agent-inspect-readev-${Date.now()}`);
    await mkdir(dir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await rm(dir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  });

  it("parses valid JSONL and skips garbage", async () => {
    const ev = runStarted({ runId: "run_parse", name: "n" });
    const line = serializeEvent(ev);
    const fp = path.join(dir, "run_parse.jsonl");
    await writeFile(
      fp,
      `${line}\n\nnot-json\n${serializeEvent({ ...ev, timestamp: ts + 1 })}\n{"bad":true}\n`,
      "utf-8",
    );
    const events = await readTraceEvents("run_parse", dir);
    expect(events.length).toBe(2);
    expect(events[0]?.event).toBe("run_started");
  });

  it("returns empty array for missing file", async () => {
    expect(await readTraceEvents("run_none", dir)).toEqual([]);
  });
});

describe("listTraceFiles", () => {
  let dir: string;

  beforeEach(async () => {
    dir = path.join(os.tmpdir(), `agent-inspect-list-${Date.now()}`);
    await mkdir(dir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await rm(dir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  });

  it("returns only jsonl files sorted by mtime desc", async () => {
    const a = path.join(dir, "a.jsonl");
    const b = path.join(dir, "b.jsonl");
    await writeFile(a, "x", "utf-8");
    await writeFile(b, "y", "utf-8");
    const older = new Date(2000, 0, 1).getTime() / 1000;
    const newer = new Date(2020, 0, 1).getTime() / 1000;
    await utimes(a, older, older);
    await utimes(b, newer, newer);
    await writeFile(path.join(dir, "notes.txt"), "z", "utf-8");
    const list = await listTraceFiles(dir);
    expect(list).toContain("a.jsonl");
    expect(list).toContain("b.jsonl");
    expect(list.some((n) => n.endsWith(".txt"))).toBe(false);
    expect(list[0]).toBe("b.jsonl");
  });

  it("returns [] for missing directory", async () => {
    expect(await listTraceFiles(path.join(dir, "absent"))).toEqual([]);
  });
});

describe("getRunIdFromTraceFileName", () => {
  it("maps jsonl basenames", () => {
    expect(getRunIdFromTraceFileName("run_abc123.jsonl")).toBe("run_abc123");
    expect(getRunIdFromTraceFileName("/tmp/run_abc123.jsonl")).toBe("run_abc123");
    expect(getRunIdFromTraceFileName("notes.txt")).toBeUndefined();
    expect(getRunIdFromTraceFileName("")).toBeUndefined();
  });
});
