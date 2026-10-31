import { mkdir, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { exportRunTree } from "../src/exporters/index.js";
import { redactRunTreeForExport } from "../src/exporters/redact-export.js";
import { manualTraceEventsToRunTree } from "../src/exporters/manual-trace-adapter.js";
import { inspectRun } from "../src/inspect-run.js";
import { Redactor } from "../src/logs/redactor.js";
import {
  resolveRedactionProfile,
  SHARE_PROFILE_EXTRA_KEYS,
  STRICT_PROFILE_EXTRA_KEYS,
} from "../src/redaction-profiles.js";
import * as storage from "../src/storage.js";
import {
  prepareMetadataForDisk,
  resolveTraceSafetyOptions,
} from "../src/trace-event-safety.js";
import type { TraceEvent } from "../src/types.js";

describe("resolveRedactionProfile", () => {
  it("local has no extra keys", () => {
    expect(resolveRedactionProfile("local").extraKeys).toEqual([]);
  });

  it("share includes correlation and customer keys", () => {
    const keys = resolveRedactionProfile("share").extraKeys;
    expect(keys).toContain("correlationId");
    expect(keys).toContain("customerId");
    expect(SHARE_PROFILE_EXTRA_KEYS.every((k) => keys.includes(k))).toBe(true);
  });

  it("strict includes share and content keys", () => {
    const keys = resolveRedactionProfile("strict").extraKeys;
    expect(keys).toContain("prompt");
    expect(keys).toContain("output");
    expect(STRICT_PROFILE_EXTRA_KEYS.every((k) => keys.includes(k))).toBe(true);
  });
});

describe("Redactor profile keys", () => {
  it("local profile behaves like default redaction", () => {
    const local = new Redactor();
    const def = new Redactor();
    const input = { token: "secret", safe: "ok" };
    expect(local.redactRecord(input)).toEqual(def.redactRecord(input));
  });

  it("share profile redacts correlationId and customerId", () => {
    const r = new Redactor({ extraKeys: resolveRedactionProfile("share").extraKeys });
    const out = r.redactRecord({
      correlationId: "corr-1",
      customerId: "cust-9",
      environment: "test",
    });
    expect(out.correlationId).toBe("[REDACTED]");
    expect(out.customerId).toBe("[REDACTED]");
    expect(out.environment).toBe("test");
  });

  it("strict profile redacts prompt and message-like keys", () => {
    const r = new Redactor({ extraKeys: resolveRedactionProfile("strict").extraKeys });
    const out = r.redactRecord({
      prompt: "system instructions",
      message: "hello",
      model: "gpt-4",
    });
    expect(out.prompt).toBe("[REDACTED]");
    expect(out.message).toBe("[REDACTED]");
    expect(out.model).toBe("gpt-4");
  });

  it("strict profile redacts nested stack copies and share does not", () => {
    const stack = "Error: synthetic-private-sentence-uduak\n    at frame (/tmp/synthetic-private/uduak-secret.txt:1:1)";
    const input = {
      stack,
      errorStack: stack,
      stackTrace: stack,
      cause: { stack, message: "synthetic-private-sentence-uduak" },
      copies: [{ errorStack: stack }],
      operationId: "tenant-residual-not-a-stack",
    };
    const strict = new Redactor({
      extraKeys: resolveRedactionProfile("strict").extraKeys,
    }).redactRecord(input);
    expect(JSON.stringify(strict)).not.toContain("synthetic-private-sentence-uduak");
    expect(JSON.stringify(strict)).not.toContain("/tmp/synthetic-private/uduak-secret.txt");
    expect(strict.operationId).toBe("tenant-residual-not-a-stack");
    expect(input.stack).toContain("/tmp/synthetic-private/uduak-secret.txt");

    const share = new Redactor({
      extraKeys: resolveRedactionProfile("share").extraKeys,
    }).redactRecord(input);
    expect(share.stack).toContain("/tmp/synthetic-private/uduak-secret.txt");
    expect(resolveRedactionProfile("local").extraKeys).not.toContain("stack");
    expect(resolveRedactionProfile("share").extraKeys).not.toContain("stack");
  });

  it("custom rules still apply with profile extra keys", () => {
    const r = new Redactor({
      extraKeys: resolveRedactionProfile("share").extraKeys,
      rules: [{ key: "customSecret", strategy: "full" }],
    });
    const out = r.redactRecord({ customSecret: "x", correlationId: "y" });
    expect(out.customSecret).toBe("[REDACTED]");
    expect(out.correlationId).toBe("[REDACTED]");
  });
});

describe("trace writing redactionProfile", () => {
  let traceDir: string;

  beforeEach(async () => {
    traceDir = path.join(os.tmpdir(), `agent-inspect-profile-${Date.now()}`);
    await mkdir(traceDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await rm(traceDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  });

  async function readRunStarted(): Promise<
    Extract<TraceEvent, { event: "run_started" }> | undefined
  > {
    const files = await readdir(traceDir);
    const runId = files.find((f) => f.endsWith(".jsonl"))!.replace(/\.jsonl$/, "");
    const events = await storage.readTraceEvents(runId, traceDir);
    const start = events.find((e) => e.event === "run_started");
    return start?.event === "run_started" ? start : undefined;
  }

  it("share profile redacts correlationId on run_started metadata", async () => {
    await inspectRun("share-run", async () => "ok", {
      traceDir,
      silent: true,
      redactionProfile: "share",
      correlationId: "corr-share",
      metadata: { customerId: "cust-1", environment: "ci" },
    });
    const start = await readRunStarted();
    expect(start?.metadata?.correlationId).toBe("[REDACTED]");
    expect(start?.metadata?.customerId).toBe("[REDACTED]");
    expect(start?.metadata?.environment).toBe("ci");
  });

  it("strict profile redacts prompt-like metadata", async () => {
    await inspectRun("strict-run", async () => "ok", {
      traceDir,
      silent: true,
      redactionProfile: "strict",
      metadata: { prompt: "secret prompt", model: "m1" },
    });
    const start = await readRunStarted();
    expect(start?.metadata?.prompt).toBe("[REDACTED]");
    expect(start?.metadata?.model).toBe("m1");
  });

  it("redact:false opts out even when redactionProfile is set", async () => {
    await inspectRun("no-redact", async () => "ok", {
      traceDir,
      silent: true,
      redact: false,
      redactionProfile: "strict",
      correlationId: "corr-plain",
      metadata: { prompt: "visible" },
    });
    const start = await readRunStarted();
    expect(start?.metadata?.correlationId).toBe("corr-plain");
    expect(start?.metadata?.prompt).toBe("visible");
  });

  it("share profile tightens metadata string bounds", () => {
    const opts = resolveTraceSafetyOptions({ redactionProfile: "share" });
    expect(opts.maxMetadataValueLength).toBeLessThanOrEqual(500);
    expect(opts.maxPreviewLength).toBeLessThanOrEqual(200);
    const long = "x".repeat(800);
    const out = prepareMetadataForDisk({ note: long }, opts);
    expect(String(out.note).length).toBeLessThan(600);
  });
});

function traceWithSensitiveStepMetadata(): TraceEvent[] {
  return [
    {
      schemaVersion: "0.1",
      event: "run_started",
      timestamp: 1,
      runId: "run_redact",
      name: "redact-run",
      startTime: 1,
    },
    {
      schemaVersion: "0.1",
      event: "step_started",
      timestamp: 2,
      runId: "run_redact",
      stepId: "s1",
      name: "step-1",
      type: "logic",
      startTime: 2,
      metadata: {
        correlationId: "corr-export",
        customerId: "cust-export",
        prompt: "do not share",
        message: "hello world",
      },
    },
    {
      schemaVersion: "0.1",
      event: "step_completed",
      timestamp: 3,
      runId: "run_redact",
      stepId: "s1",
      status: "success",
      endTime: 3,
      durationMs: 1,
    },
    {
      schemaVersion: "0.1",
      event: "run_completed",
      timestamp: 4,
      runId: "run_redact",
      status: "success",
      endTime: 4,
      durationMs: 3,
    },
  ];
}

describe("export redaction profiles", () => {
  it("redactRunTreeForExport does not mutate the original tree", () => {
    const tree = manualTraceEventsToRunTree(traceWithSensitiveStepMetadata());
    const original = tree.children[0]?.event.attributes?.correlationId;
    redactRunTreeForExport(tree, { redactionProfile: "share" });
    expect(tree.children[0]?.event.attributes?.correlationId).toBe(original);
  });

  it("markdown export with share profile redacts correlationId and customerId", () => {
    const tree = manualTraceEventsToRunTree(traceWithSensitiveStepMetadata());
    const result = exportRunTree(tree, {
      format: "markdown",
      includeAttributes: true,
      redactionProfile: "share",
    });
    expect(result.content).toContain("[REDACTED]");
    expect(result.content).not.toContain("corr-export");
    expect(result.content).not.toContain("cust-export");
  });

  it("html export with strict profile redacts prompt and message fields", () => {
    const tree = manualTraceEventsToRunTree(traceWithSensitiveStepMetadata());
    const result = exportRunTree(tree, {
      format: "html",
      includeAttributes: true,
      redactionProfile: "strict",
    });
    expect(result.content).toContain("[REDACTED]");
    expect(result.content).not.toContain("do not share");
    expect(result.content).not.toContain("hello world");
  });

  it("strict export drops stack canaries from html, markdown, and openinference", () => {
    const message = "synthetic-private-sentence-uduak";
    const pathCanary = "/tmp/synthetic-private/uduak-secret.txt";
    const stack = `Error: ${message}\n    at frame (${pathCanary}:1:1)`;
    const events = traceWithSensitiveStepMetadata();
    const stepCompleted = events.find((event) => event.event === "step_completed");
    if (stepCompleted?.event === "step_completed") {
      stepCompleted.error = {
        message,
        stack,
        cause: { message, stack, stackTrace: stack },
      } as typeof stepCompleted.error;
    }
    const runCompleted = events.find((event) => event.event === "run_completed");
    if (runCompleted?.event === "run_completed") {
      runCompleted.status = "error";
      runCompleted.error = { message, stack };
    }
    const tree = manualTraceEventsToRunTree(events);
    const original = JSON.stringify(tree);
    for (const format of ["html", "markdown", "openinference"] as const) {
      const result = exportRunTree(tree, {
        format,
        includeAttributes: true,
        includeErrors: true,
        redactionProfile: "strict",
      });
      expect(result.content).not.toContain(message);
      expect(result.content).not.toContain(pathCanary);
    }
    expect(JSON.stringify(tree)).toBe(original);
    expect(original).toContain(pathCanary);
  });

  it("openinference export redacts preview attributes under share profile", () => {
    const tree = manualTraceEventsToRunTree(traceWithSensitiveStepMetadata());
    const result = exportRunTree(tree, {
      format: "openinference",
      includeAttributes: true,
      redactionProfile: "share",
    });
    const parsed = JSON.parse(result.content) as {
      spans: Array<{ attributes: Record<string, unknown> }>;
    };
    const attrs = parsed.spans[0]?.attributes ?? {};
    const values = Object.values(attrs).join(" ");
    expect(values).not.toContain("corr-export");
    expect(values).not.toContain("cust-export");
  });
});
