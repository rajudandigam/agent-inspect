import { mkdir, readdir, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { inspectRun } from "../src/inspect-run.js";
import { step } from "../src/step.js";
import {
  preparePersistedInspectEventForWrite,
  prepareTraceEventForDisk,
  resolveTraceSafetyOptions,
} from "../src/trace-event-safety.js";
import type { TraceEvent } from "../src/types.js";
import {
  redactHighConfidenceCredentialsInString,
  stringContainsHighConfidenceCredential,
} from "../src/safety/credential-value-patterns.js";

const FIXTURE_SK = "sk-proj-abcdefghijklmnopqrstuvwxyz";
const FIXTURE_BEARER = "Bearer abcdefghijklmnop";
const MESSAGE_CANARY = "synthetic-private-sentence-uduak";
const PATH_CANARY = "/tmp/synthetic-private/uduak-secret.txt";

function stackWithCanaries(frame: string): string {
  return `Error: ${MESSAGE_CANARY}\n    at ${frame} (${PATH_CANARY}:1:1)`;
}

function syntheticError(): Error {
  const cause = new Error(MESSAGE_CANARY);
  cause.stack = stackWithCanaries("nestedCause");
  const error = new Error(MESSAGE_CANARY);
  error.stack = stackWithCanaries("outerFrame");
  (error as Error & { cause?: unknown }).cause = cause;
  return error;
}

async function readStepCompleted(traceDir: string): Promise<TraceEvent | undefined> {
  const files = await readdir(traceDir);
  const jsonl = files.find((f) => f.endsWith(".jsonl"));
  if (!jsonl) return undefined;
  const raw = await readFile(path.join(traceDir, jsonl), "utf-8");
  const line = raw.split("\n").find((l) => l.includes("step_completed"));
  if (!line?.trim()) return undefined;
  return JSON.parse(line.trim()) as TraceEvent;
}

describe("pre-disk error message credential protection", () => {
  let traceDir: string;

  beforeEach(async () => {
    traceDir = path.join(os.tmpdir(), `agent-inspect-err-redact-${Date.now()}`);
    await mkdir(traceDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await rm(traceDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  });

  it("detects provider API keys and bearer tokens in free text", () => {
    expect(stringContainsHighConfidenceCredential(`failed: ${FIXTURE_SK}`)).toBe(true);
    expect(stringContainsHighConfidenceCredential(`auth ${FIXTURE_BEARER}`)).toBe(true);
    expect(stringContainsHighConfidenceCredential("tool timed out after 30s")).toBe(false);
    expect(redactHighConfidenceCredentialsInString(`failed: ${FIXTURE_SK}`)).toBe("[REDACTED]");
    expect(redactHighConfidenceCredentialsInString("tool timed out after 30s")).toBe(
      "tool timed out after 30s",
    );
  });

  it("preparePersistedInspectEventForWrite redacts free-text secrets in error.message", () => {
    const event = preparePersistedInspectEventForWrite(
      {
        schemaVersion: "1.0",
        eventId: "evt_1",
        runId: "run_1",
        kind: "LOGIC",
        name: "failing-step",
        timestamp: "2026-09-11T00:00:00.000Z",
        confidence: "explicit",
        status: "error",
        source: { type: "manual" },
        error: {
          message: `Upstream rejected request using ${FIXTURE_SK}`,
          name: "Error",
        },
      },
      resolveTraceSafetyOptions(),
    );
    expect(event?.error?.message).toBe("[REDACTED]");
    expect(JSON.stringify(event)).not.toContain(FIXTURE_SK);
  });

  it("preparePersistedInspectEventForWrite preserves ordinary error text", () => {
    const event = preparePersistedInspectEventForWrite(
      {
        schemaVersion: "1.0",
        eventId: "evt_2",
        runId: "run_2",
        kind: "LOGIC",
        name: "failing-step",
        timestamp: "2026-09-11T00:00:00.000Z",
        confidence: "explicit",
        status: "error",
        source: { type: "manual" },
        error: {
          message: "Connection refused on port 5432",
          name: "Error",
        },
      },
      resolveTraceSafetyOptions(),
    );
    expect(event?.error?.message).toBe("Connection refused on port 5432");
  });

  it("preparePersistedInspectEventForWrite respects redact:false opt-out", () => {
    const event = preparePersistedInspectEventForWrite(
      {
        schemaVersion: "1.0",
        eventId: "evt_3",
        runId: "run_3",
        kind: "LOGIC",
        name: "failing-step",
        timestamp: "2026-09-11T00:00:00.000Z",
        confidence: "explicit",
        status: "error",
        source: { type: "manual" },
        error: {
          message: `Upstream rejected request using ${FIXTURE_SK}`,
        },
      },
      resolveTraceSafetyOptions({ redact: false }),
    );
    expect(event?.error?.message).toContain(FIXTURE_SK);
  });

  it("inspectRun redacts free-text secrets in step error messages before disk", async () => {
    await expect(
      inspectRun(
        "err-secret-run",
        async () => {
          throw new Error(`LLM call failed with ${FIXTURE_SK}`);
        },
        { traceDir, silent: true },
      ),
    ).rejects.toThrow(/LLM call failed/);

    const completed = await readStepCompleted(traceDir);
    // run_completed may be the only completion; also check run file for any error message
    const files = await readdir(traceDir);
    const jsonl = files.find((f) => f.endsWith(".jsonl"));
    expect(jsonl).toBeDefined();
    const raw = await readFile(path.join(traceDir, jsonl!), "utf-8");
    expect(raw).not.toContain(FIXTURE_SK);
    expect(raw).toMatch(/\[REDACTED\]/);
    void completed;
  });

  it("inspectRun redact:false preserves free-text secrets in error messages", async () => {
    await expect(
      inspectRun(
        "err-opt-out",
        async () => {
          throw new Error(`LLM call failed with ${FIXTURE_SK}`);
        },
        { traceDir, silent: true, redact: false },
      ),
    ).rejects.toThrow(/LLM call failed/);

    const files = await readdir(traceDir);
    const jsonl = files.find((f) => f.endsWith(".jsonl"));
    const raw = await readFile(path.join(traceDir, jsonl!), "utf-8");
    expect(raw).toContain(FIXTURE_SK);
  });

  it("strict profile removes stack canaries before disk and leaves the thrown error intact", async () => {
    const thrown = syntheticError();
    await expect(
      inspectRun(
        "strict-stack",
        async () => {
          await step("failing-step", () => {
            throw thrown;
          });
        },
        { traceDir, silent: true, redactionProfile: "strict" },
      ),
    ).rejects.toBe(thrown);

    expect(thrown.message).toContain(MESSAGE_CANARY);
    expect(thrown.stack).toContain(PATH_CANARY);
    const files = await readdir(traceDir);
    const jsonl = files.find((f) => f.endsWith(".jsonl"));
    const raw = await readFile(path.join(traceDir, jsonl!), "utf-8");
    expect(raw).toContain("step_completed");
    expect(raw).toContain("run_completed");
    expect(raw).not.toContain(MESSAGE_CANARY);
    expect(raw).not.toContain(PATH_CANARY);
  });

  it("local profile keeps diagnostic stacks", async () => {
    await expect(
      inspectRun(
        "local-stack",
        async () => {
          throw syntheticError();
        },
        { traceDir, silent: true, redactionProfile: "local" },
      ),
    ).rejects.toThrow(MESSAGE_CANARY);

    const files = await readdir(traceDir);
    const jsonl = files.find((f) => f.endsWith(".jsonl"));
    const raw = await readFile(path.join(traceDir, jsonl!), "utf-8");
    expect(raw).toContain(PATH_CANARY);
    expect(raw).toContain(MESSAGE_CANARY);
  });

  it("strict persisted writes redact nested stack copies and keep non-stack residuals", () => {
    const stack = stackWithCanaries("persisted");
    const event = preparePersistedInspectEventForWrite(
      {
        schemaVersion: "1.0",
        eventId: "evt_stack",
        runId: "run_stack",
        kind: "LOGIC",
        name: "failing-step",
        timestamp: "2026-10-22T00:00:00.000Z",
        confidence: "explicit",
        status: "error",
        source: { type: "manual" },
        error: { message: MESSAGE_CANARY, name: "Error" },
        attributes: {
          errorStack: stack,
          stackTrace: stack,
          cause: { message: MESSAGE_CANARY, stack },
          copies: [{ stack, errorStack: stack, stackTrace: stack }],
          operationId: "tenant-residual-not-a-stack",
        },
      },
      resolveTraceSafetyOptions({ redactionProfile: "strict" }),
    );
    const serialized = JSON.stringify(event);
    expect(serialized).not.toContain(MESSAGE_CANARY);
    expect(serialized).not.toContain(PATH_CANARY);
    expect(serialized).toContain("tenant-residual-not-a-stack");
    expect(serialized).not.toContain("stackPolicySatisfied");

    const local = preparePersistedInspectEventForWrite(
      {
        schemaVersion: "1.0",
        eventId: "evt_stack_local",
        runId: "run_stack_local",
        kind: "LOGIC",
        name: "failing-step",
        timestamp: "2026-10-22T00:00:00.000Z",
        confidence: "explicit",
        status: "error",
        source: { type: "manual" },
        attributes: { errorStack: stack },
      },
      resolveTraceSafetyOptions({ redactionProfile: "local" }),
    );
    expect(JSON.stringify(local)).toContain(PATH_CANARY);
  });

  it("strict trace preparation redacts nested cause stacks on step and run completion", () => {
    const stack = stackWithCanaries("prepared");
    const base = {
      schemaVersion: "0.1" as const,
      timestamp: 3,
      runId: "run_prepared",
      status: "error" as const,
      endTime: 4,
      durationMs: 1,
      error: {
        message: MESSAGE_CANARY,
        stack,
        cause: { message: MESSAGE_CANARY, stack, stackTrace: stack },
      },
    };
    for (const event of [
      { ...base, event: "step_completed" as const, stepId: "s1" },
      { ...base, event: "run_completed" as const },
    ]) {
      const prepared = prepareTraceEventForDisk(
        event,
        resolveTraceSafetyOptions({ redactionProfile: "strict" }),
      );
      const serialized = JSON.stringify(prepared);
      expect(serialized).not.toContain(MESSAGE_CANARY);
      expect(serialized).not.toContain(PATH_CANARY);
      expect(JSON.stringify(event.error)).toContain(PATH_CANARY);
    }
  });

  it("inspectRun redacts bearer tokens embedded in error messages", async () => {
    await expect(
      inspectRun(
        "err-bearer",
        async () => {
          throw new Error(`Authorization failed: ${FIXTURE_BEARER}`);
        },
        { traceDir, silent: true },
      ),
    ).rejects.toThrow(/Authorization failed/);

    const files = await readdir(traceDir);
    const jsonl = files.find((f) => f.endsWith(".jsonl"));
    const raw = await readFile(path.join(traceDir, jsonl!), "utf-8");
    expect(raw).not.toContain("abcdefghijklmnop");
    expect(raw).toMatch(/\[REDACTED\]/);
  });
});
