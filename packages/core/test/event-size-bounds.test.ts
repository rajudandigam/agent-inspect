import { mkdir, readdir, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { inspectRun } from "../src/inspect-run.js";
import { step } from "../src/step.js";
import {
  prepareMetadataForDisk,
  prepareTraceEventForDisk,
  resolveTraceSafetyOptions,
} from "../src/trace-event-safety.js";
import * as storage from "../src/storage.js";
import type { TraceEvent } from "../src/types.js";

const ts = 1_700_000_000_000;

async function readRawJsonl(traceDir: string): Promise<string[]> {
  const files = await readdir(traceDir);
  const jsonl = files.find((f) => f.endsWith(".jsonl"));
  if (!jsonl) return [];
  const raw = await readFile(path.join(traceDir, jsonl), "utf-8");
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l !== "");
}

describe("event size bounds", () => {
  let traceDir: string;

  beforeEach(async () => {
    traceDir = path.join(os.tmpdir(), `agent-inspect-size-${Date.now()}`);
    await mkdir(traceDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await rm(traceDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  });

  it("truncates large string metadata values", async () => {
    const long = "x".repeat(5000);
    await inspectRun(
      "long-meta",
      async () => "ok",
      {
        traceDir,
        silent: true,
        metadata: { note: long },
        maxMetadataValueLength: 100,
      },
    );

    const lines = await readRawJsonl(traceDir);
    const started = JSON.parse(lines[0]!) as TraceEvent;
    expect(started.event).toBe("run_started");
    if (started.event === "run_started") {
      expect(String(started.metadata?.note)).toMatch(/…$/);
      expect(String(started.metadata?.note).length).toBeLessThanOrEqual(101);
    }
  });

  it("truncates preview-like metadata keys with maxPreviewLength", () => {
    const opts = resolveTraceSafetyOptions({ maxPreviewLength: 20 });
    const out = prepareMetadataForDisk(
      { outputPreview: "p".repeat(200), safe: "ok" },
      opts,
    );
    expect(String(out.outputPreview)).toMatch(/…$/);
    expect(String(out.outputPreview).length).toBeLessThanOrEqual(21);
    expect(out.safe).toBe("ok");
  });

  it("truncates large nested metadata safely", () => {
    const opts = resolveTraceSafetyOptions({ maxMetadataValueLength: 50 });
    const out = prepareMetadataForDisk(
      {
        nested: { detail: "d".repeat(200) },
        items: Array.from({ length: 80 }, (_, i) => `item-${i}`),
      },
      opts,
    );
    expect(String((out.nested as Record<string, unknown>).detail)).toMatch(/…$/);
    expect(Array.isArray(out.items)).toBe(true);
    expect((out.items as unknown[]).length).toBeLessThanOrEqual(51);
  });

  it("maxEventBytes produces valid JSONL with required fields", async () => {
    const huge = "z".repeat(120_000);
    await inspectRun(
      "huge-run",
      async () => "ok",
      {
        traceDir,
        silent: true,
        metadata: { blob: huge },
        maxEventBytes: 2048,
        maxMetadataValueLength: 120_000,
      },
    );

    const lines = await readRawJsonl(traceDir);
    expect(lines.length).toBeGreaterThanOrEqual(2);
    for (const line of lines) {
      expect(() => JSON.parse(line)).not.toThrow();
      const parsed = JSON.parse(line) as TraceEvent;
      expect(parsed.schemaVersion).toBe("0.1");
      expect(storage.validateEvent(parsed)).toBe(true);
    }

    const started = JSON.parse(lines[0]!) as TraceEvent;
    expect(started.event).toBe("run_started");
    if (started.event === "run_started") {
      expect(started.runId).toBeTruthy();
      expect(started.name).toBeTruthy();
      expect(Buffer.byteLength(lines[0]!, "utf8")).toBeLessThanOrEqual(2048);
    }
  });

  it("maxEventBytes replaces metadata with truncation marker when still too large", () => {
    const maxEventBytes = 512;
    const opts = resolveTraceSafetyOptions({
      maxEventBytes,
      maxMetadataValueLength: 10_000,
    });
    const event: TraceEvent = {
      schemaVersion: "0.1",
      event: "run_started",
      timestamp: ts,
      runId: "run_size_marker",
      name: "n",
      startTime: ts,
      metadata: { blob: "q".repeat(20_000) },
    };
    const safe = prepareTraceEventForDisk(event, opts);
    expect(safe.event).toBe("run_started");
    if (safe.event === "run_started") {
      expect(safe.metadata).toEqual(
        expect.objectContaining({
          truncated: true,
          reason: "maxEventBytes",
          originalApproxBytes: expect.any(Number),
        }),
      );
    }
    const line = storage.serializeEvent(safe);
    expect(Buffer.byteLength(line, "utf8")).toBeLessThanOrEqual(maxEventBytes);
    expect(storage.validateEvent(safe)).toBe(true);
  });

  it("maxEventBytes does not remove required event fields", async () => {
    await inspectRun(
      "req-fields",
      async () =>
        step("s", async () => "x", {
          metadata: { payload: "y".repeat(50_000) },
        }),
      {
        traceDir,
        silent: true,
        maxEventBytes: 1500,
      },
    );

    const files = await readdir(traceDir);
    const runId = files.find((f) => f.endsWith(".jsonl"))!.replace(/\.jsonl$/, "");
    const events = await storage.readTraceEvents(runId, traceDir);
    const stepStart = events.find((e) => e.event === "step_started");
    expect(stepStart?.event).toBe("step_started");
    if (stepStart?.event === "step_started") {
      expect(stepStart.runId).toBe(runId);
      expect(stepStart.stepId).toBeTruthy();
      expect(stepStart.name).toBe("s");
      expect(stepStart.type).toBe("logic");
      expect(stepStart.startTime).toEqual(expect.any(Number));
    }
  });

  it("user function return value preserved when metadata is truncated", async () => {
    const result = await inspectRun(
      "ret",
      async () => ({ secret: "keep-me", size: 42 }),
      {
        traceDir,
        silent: true,
        metadata: { blob: "a".repeat(100_000) },
        maxEventBytes: 1024,
      },
    );
    expect(result).toEqual({ secret: "keep-me", size: 42 });
  });

  it("user errors still rethrow when metadata is truncated", async () => {
    const err = new Error("size-bound-user-error");
    await expect(
      inspectRun(
        "err",
        async () => {
          throw err;
        },
        {
          traceDir,
          silent: true,
          metadata: { blob: "b".repeat(100_000) },
          maxEventBytes: 1024,
        },
      ),
    ).rejects.toBe(err);
  });

  it("instrumentation errors swallowed when size preparation fails internally", async () => {
    const spy = vi.spyOn(storage, "writeTraceEvent").mockImplementation(() =>
      Promise.reject(new Error("disk down")),
    );
    const result = await inspectRun(
      "inst",
      async () => "still-ok",
      { traceDir, silent: true, metadata: { x: 1 } },
    );
    expect(result).toBe("still-ok");
    spy.mockRestore();
  });
});
