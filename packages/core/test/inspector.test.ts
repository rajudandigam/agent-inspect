import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { createInspector } from "../src/inspector.js";
import {
  resolveTraceSafetyOptions,
  type TraceSafetyOptions,
} from "../src/trace-event-safety.js";
import type { PersistedInspectEvent } from "../src/types/persisted-inspect-event.js";
import {
  bufferedFileWriter,
  compositeWriter,
  fileWriter,
  memoryWriter,
  type TraceWriter,
} from "../src/writers/index.js";

describe("createInspector", () => {
  it("records run lifecycle events and preserves return values", async () => {
    const writer = memoryWriter();
    const inspector = createInspector({
      writer,
      metadata: { correlationId: "corr-create" },
    });

    const result = await inspector.run(
      "support-agent",
      async () => "ok",
      { runId: "run_create" },
    );
    await inspector.flush();

    expect(result).toBe("ok");
    expect(writer.getEvents().every((event) => event.schemaVersion === "1.0")).toBe(
      true,
    );
    expect(writer.getEvents()).toEqual([
      expect.objectContaining({
        schemaVersion: "1.0",
        eventId: "run_create_started",
        runId: "run_create",
        kind: "RUN",
        status: "running",
        attributes: {
          legacyEvent: "run_started",
          metadata: { correlationId: "corr-create" },
        },
      }),
      expect.objectContaining({
        schemaVersion: "1.0",
        eventId: "run_create_completed",
        runId: "run_create",
        kind: "RUN",
        status: "ok",
        attributes: { legacyEvent: "run_completed" },
      }),
    ]);
  });

  it("records nested steps, tools, and llms with parent linkage", async () => {
    const writer = memoryWriter();
    const inspector = createInspector({ writer });

    await inspector.run(
      "agent",
      async () => {
        await inspector.step("plan", async () => {
          await inspector.tool("retrieve-policy", async () => "policy");
          await inspector.llm("answer-model", async () => "answer");
        });
      },
      { runId: "run_nested" },
    );

    const events = writer.getEvents();
    const stepStarts = events.filter(
      (event) => event.attributes?.legacyEvent === "step_started",
    );
    const planStart = stepStarts.find((event) => event.name === "plan")!;
    const toolStart = stepStarts.find((event) => event.name === "tool:retrieve-policy")!;
    const llmStart = stepStarts.find((event) => event.name === "llm:answer-model")!;

    expect(planStart.attributes?.stepType).toBe("logic");
    expect(toolStart.parentId).toBe(planStart.attributes?.stepId);
    expect(toolStart.kind).toBe("TOOL");
    expect(toolStart.attributes?.metadata).toEqual({
      toolName: "retrieve-policy",
    });
    expect(llmStart.parentId).toBe(planStart.attributes?.stepId);
    expect(llmStart.kind).toBe("LLM");
    expect(llmStart.attributes?.metadata).toEqual({
      model: "answer-model",
    });
  });

  it("applies trace safety to run and step metadata before writing", async () => {
    const writer = memoryWriter();
    const inspector = createInspector({
      writer,
      redactionProfile: "strict",
      metadata: {
        email: "person@example.com",
        requestId: "req_secret",
      },
    });

    await inspector.run(
      "safe-run",
      async () => {
        await inspector.step("safe-step", async () => "ok", {
          metadata: {
            prompt: "sensitive prompt",
            nested: { apiKey: "secret-key" },
          },
        });
      },
      { runId: "run_safe" },
    );

    const runStarted = writer.getEvents().find(
      (event) => event.attributes?.legacyEvent === "run_started",
    );
    const stepStarted = writer.getEvents().find(
      (event) => event.attributes?.legacyEvent === "step_started",
    );

    expect(runStarted?.attributes?.metadata).toMatchObject({
      email: "[REDACTED]",
      requestId: "[REDACTED]",
    });
    expect(stepStarted?.attributes?.metadata).toMatchObject({
      prompt: "[REDACTED]",
      nested: { apiKey: "[REDACTED]" },
    });
  });

  it("bounds oversized persisted metadata without changing application results", async () => {
    const writer = memoryWriter();
    const inspector = createInspector({
      writer,
      traceSafety: {
        redactEnabled: true,
        redactionProfile: "local",
        profileExtraKeys: [],
        maxMetadataValueLength: 400,
        maxPreviewLength: 120,
        maxEventBytes: 600,
      },
    });

    const result = await inspector.run(
      "oversized-safe-run",
      async () => "ok",
      {
        runId: "run_oversized",
        metadata: {
          ...Object.fromEntries(
            Array.from({ length: 30 }, (_, index) => [
              `outputPreview${index}`,
              "x".repeat(10_000),
            ]),
          ),
          password: "secret",
        },
      },
    );

    const started = writer.getEvents().find(
      (event) => event.eventId === "run_oversized_started",
    );

    expect(result).toBe("ok");
    expect(started).toMatchObject({
      schemaVersion: "1.0",
      runId: "run_oversized",
      attributes: {
        truncated: true,
        reason: "maxEventBytes",
      },
    });
    expect(Buffer.byteLength(JSON.stringify(started), "utf8")).toBeLessThanOrEqual(600);
  });

  it("captures metadata-only success summaries when enabled", async () => {
    const writer = memoryWriter();
    const inspector = createInspector({
      writer,
      capture: { onSuccess: "metadata-only" },
    });

    const result = await inspector.run(
      "captured-run",
      async () => {
        await inspector.step("captured-step", async () => ({ ok: true, secret: "value" }));
        return ["a", "b"];
      },
      { runId: "run_capture_success" },
    );

    expect(result).toEqual(["a", "b"]);

    const events = writer.getEvents();
    const stepCompleted = events.find(
      (event) => event.attributes?.legacyEvent === "step_completed",
    );
    const runCompleted = events.find(
      (event) => event.eventId === "run_capture_success_completed",
    );

    expect(stepCompleted?.outputSummary).toEqual({
      type: "object",
      constructorName: "Object",
      keyCount: 2,
    });
    expect(runCompleted?.outputSummary).toEqual({
      type: "array",
      length: 2,
    });
  });

  it("omits capture summaries when capture is disabled", async () => {
    const writer = memoryWriter();
    const inspector = createInspector({
      writer,
      capture: { onSuccess: "none", onError: "none" },
    });

    await inspector.run(
      "uncaptured-run",
      async () => {
        await inspector.step("uncaptured-step", async () => "secret-result");
        return "secret-run";
      },
      { runId: "run_capture_none" },
    );

    const completed = writer.getEvents().filter(
      (event) => event.attributes?.legacyEvent?.toString().endsWith("completed"),
    );

    expect(completed.every((event) => event.outputSummary === undefined)).toBe(true);
  });

  it("isolates parallel branches and multiple inspector instances", async () => {
    const firstWriter = memoryWriter();
    const secondWriter = memoryWriter();
    const first = createInspector({ writer: firstWriter });
    const second = createInspector({ writer: secondWriter });

    await Promise.all([
      first.run(
        "first",
        async () => {
          await Promise.all([
            first.step("a", async () => "a"),
            first.step("b", async () => "b"),
          ]);
        },
        { runId: "run_first" },
      ),
      second.run(
        "second",
        async () => {
          await second.step("c", async () => "c");
        },
        { runId: "run_second" },
      ),
    ]);

    expect(new Set(firstWriter.getEvents().map((event) => event.runId))).toEqual(
      new Set(["run_first"]),
    );
    expect(new Set(secondWriter.getEvents().map((event) => event.runId))).toEqual(
      new Set(["run_second"]),
    );
  });

  it("rethrows application errors unchanged while recording error status", async () => {
    const writer = memoryWriter();
    const inspector = createInspector({ writer });
    const appError = new Error("user boom");

    await expect(
      inspector.run(
        "failing-run",
        async () => {
          await inspector.step("failing-step", async () => {
            throw appError;
          });
        },
        { runId: "run_error" },
      ),
    ).rejects.toBe(appError);

    const events = writer.getEvents();
    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          runId: "run_error",
          status: "error",
          error: { name: "Error", message: "user boom" },
          attributes: { legacyEvent: "step_completed", stepId: expect.any(String), stepType: "logic" },
        }),
        expect.objectContaining({
          eventId: "run_error_completed",
          status: "error",
          error: { name: "Error", message: "user boom" },
        }),
      ]),
    );
  });

  it("preserves bounded safe error codes and numeric status codes", async () => {
    const writer = memoryWriter();
    const inspector = createInspector({ writer });

    const timeout = new Error("timed out") as Error & { code?: string };
    timeout.code = "ETIMEDOUT";
    await expect(
      inspector.run("code-run", async () => {
        await inspector.step("timeout-step", async () => {
          throw timeout;
        });
      }, { runId: "run_error_code" }),
    ).rejects.toBe(timeout);

    const http = Object.assign(new Error("not found"), { status: 404 });
    await expect(
      inspector.run("status-run", async () => {
        throw http;
      }, { runId: "run_error_status" }),
    ).rejects.toBe(http);

    const unsafe = Object.assign(new Error("secret fail"), {
      code: "line1\nline2",
      body: { token: "should-not-persist" },
      headers: { authorization: "Bearer secret" },
    });
    await expect(
      inspector.run("unsafe-run", async () => {
        throw unsafe;
      }, { runId: "run_error_unsafe" }),
    ).rejects.toBe(unsafe);

    const events = writer.getEvents();
    expect(
      events.find((event) => event.eventId === "run_error_code_completed")?.error,
    ).toEqual({ name: "Error", message: "timed out", code: "ETIMEDOUT" });
    expect(
      events.find((event) => event.eventId === "run_error_status_completed")?.error,
    ).toEqual({ name: "Error", message: "not found", code: "404" });
    const unsafePersisted = events.find(
      (event) => event.eventId === "run_error_unsafe_completed",
    )?.error;
    expect(unsafePersisted).toEqual({ name: "Error", message: "secret fail" });
    expect(JSON.stringify(unsafePersisted)).not.toContain("should-not-persist");
    expect(JSON.stringify(unsafePersisted)).not.toContain("Bearer");
  });

  it("rethrows application errors unchanged when persisted error details are bounded", async () => {
    const writer = memoryWriter();
    const inspector = createInspector({
      writer,
      traceSafety: {
        redactEnabled: true,
        redactionProfile: "strict",
        profileExtraKeys: ["message"],
        maxMetadataValueLength: 32,
        maxPreviewLength: 16,
        maxEventBytes: 800,
      },
    });
    const appError = new Error("secret ".repeat(1_000));

    await expect(
      inspector.run(
        "bounded-error-run",
        async () => {
          throw appError;
        },
        { runId: "run_bounded_error" },
      ),
    ).rejects.toBe(appError);

    const completed = writer.getEvents().find(
      (event) => event.eventId === "run_bounded_error_completed",
    );

    expect(completed?.error).toEqual({
      name: "Error",
      message: "[REDACTED]",
    });
  });

  it("captures metadata-only error summaries without storing thrown objects", async () => {
    const writer = memoryWriter();
    const inspector = createInspector({
      writer,
      capture: { onError: "metadata-only" },
    });
    const appError = Object.assign(new TypeError("private message"), {
      secret: "do-not-store",
    });

    await expect(
      inspector.run(
        "captured-error-run",
        async () => {
          throw appError;
        },
        { runId: "run_capture_error" },
      ),
    ).rejects.toBe(appError);

    const completed = writer.getEvents().find(
      (event) => event.eventId === "run_capture_error_completed",
    );

    expect(completed?.outputSummary).toEqual({
      type: "error",
      name: "TypeError",
    });
    expect(JSON.stringify(completed)).not.toContain("do-not-store");
  });

  it("observes functions through inspector steps", async () => {
    const writer = memoryWriter();
    const inspector = createInspector({ writer });
    const observed = inspector.observe("double", (value: number) => value * 2);

    const result = await inspector.run(
      "observe-run",
      async () => observed(21),
      { runId: "run_observe" },
    );

    expect(result).toBe(42);
    expect(
      writer.getEvents().some((event) => event.name === "double"),
    ).toBe(true);
  });

  it("passes through without context or writes when disabled", async () => {
    const writer = memoryWriter();
    const inspector = createInspector({ enabled: false, writer });

    const result = await inspector.run("disabled", async () => {
      await inspector.step("ignored", async () => "step");
      return "ok";
    });

    expect(result).toBe("ok");
    expect(writer.getEvents()).toEqual([]);
  });

  it("does not replace application results when writer fails", async () => {
    const failingWriter: TraceWriter = {
      async write() {
        throw new Error("writer failed");
      },
      getStats() {
        return {
          writtenEvents: 0,
          droppedEvents: 0,
          flushCount: 0,
        };
      },
    };
    const inspector = createInspector({ writer: failingWriter });

    await expect(
      inspector.run("writer-fails", async () => "ok", { runId: "run_writer" }),
    ).resolves.toBe("ok");
    expect(inspector.getDiagnostics()).toMatchObject({
      instrumentationErrors: 2,
      lastInstrumentationError: "writer failed",
    });
  });

  it("flushes and closes idempotently", async () => {
    const writer = memoryWriter();
    const inspector = createInspector({ writer });

    await inspector.flush();
    await inspector.close();
    await inspector.close();

    expect(writer.getStats?.()).toEqual({
      writtenEvents: 0,
      droppedEvents: 0,
      flushCount: 1,
      lastFlushAt: expect.any(String),
    });
  });
});

describe("createInspector trace safety with built-in writers", () => {
  const unredactedRunId = "run_unredacted";
  const sensitiveMetadata = {
    email: "ada@example.com",
    apiKey: "sk-demo-not-a-real-key",
  };

  async function recordSensitiveStep(writer: TraceWriter): Promise<void> {
    const inspector = createInspector({
      writer,
      traceSafety: resolveTraceSafetyOptions({ redact: false }),
    });

    await inspector.run(
      "unredacted-run",
      async () => {
        await inspector.step("load-customer", async () => "ok", {
          metadata: sensitiveMetadata,
        });
      },
      { runId: unredactedRunId },
    );
    await inspector.flush();
  }

  function stepStartedMetadata(events: PersistedInspectEvent[]): unknown {
    return events.find(
      (event) => event.attributes?.legacyEvent === "step_started",
    )?.attributes?.metadata;
  }

  async function readTraceFile(dir: string): Promise<PersistedInspectEvent[]> {
    const raw = await readFile(path.join(dir, `${unredactedRunId}.jsonl`), "utf-8");
    return raw
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => JSON.parse(line) as PersistedInspectEvent);
  }

  it("keeps metadata as provided in memoryWriter when redaction is opted out", async () => {
    const writer = memoryWriter();

    await recordSensitiveStep(writer);

    expect(stepStartedMetadata(writer.getEvents())).toMatchObject(sensitiveMetadata);
  });

  it.each([
    ["fileWriter", (dir: string) => fileWriter({ dir })],
    ["bufferedFileWriter", (dir: string) => bufferedFileWriter({ dir })],
  ])(
    "persists metadata as provided through %s when redaction is opted out",
    async (_name, createWriter) => {
      const dir = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-unredacted-"));

      try {
        await recordSensitiveStep(createWriter(dir));

        const events = await readTraceFile(dir);

        expect(stepStartedMetadata(events)).toMatchObject(sensitiveMetadata);
        expect(JSON.stringify(events)).not.toContain("redactEnabled");
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
    },
  );

  it("hands metadata as provided to compositeWriter children when redaction is opted out", async () => {
    const child = memoryWriter();

    await recordSensitiveStep(compositeWriter([child]));

    expect(stepStartedMetadata(child.getEvents())).toMatchObject(sensitiveMetadata);
  });

  it("keeps a metadata value longer than the default limit when the limit is raised", async () => {
    const writer = memoryWriter();
    const longValue = "x".repeat(3000);
    const inspector = createInspector({
      writer,
      traceSafety: resolveTraceSafetyOptions({ maxMetadataValueLength: 4000 }),
    });

    await inspector.run(
      "long-metadata-run",
      async () => {
        await inspector.step("load-document", async () => "ok", {
          metadata: { note: longValue },
        });
      },
      { runId: "run_long_metadata" },
    );
    await inspector.flush();

    expect(stepStartedMetadata(writer.getEvents())).toMatchObject({ note: longValue });
  });

  it("falls back to the default redaction when traceSafety is incomplete", async () => {
    const writer = memoryWriter();
    const inspector = createInspector({
      writer,
      traceSafety: {
        ...resolveTraceSafetyOptions(),
        redactEnabled: undefined,
      } as unknown as TraceSafetyOptions,
    });

    await inspector.run(
      "incomplete-safety-run",
      async () => {
        await inspector.step("load-customer", async () => "ok", {
          metadata: sensitiveMetadata,
        });
      },
      { runId: "run_incomplete_safety" },
    );
    await inspector.flush();

    expect(stepStartedMetadata(writer.getEvents())).toMatchObject({
      email: "[REDACTED]",
      apiKey: "[REDACTED]",
    });
  });

  it("redacts what a custom writer adds to an inspector event before forwarding it", async () => {
    const inner = memoryWriter();
    const enriching: TraceWriter = {
      async write(event) {
        event.attributes = { ...event.attributes, apiKey: "sk-demo-not-a-real-key" };
        await inner.write(event);
      },
    };
    const inspector = createInspector({ writer: enriching });

    await inspector.run("enriched-run", async () => "ok", { runId: "run_enriched" });
    await inspector.flush();

    expect(inner.getEvents().map((event) => event.attributes?.apiKey)).toEqual([
      "[REDACTED]",
      "[REDACTED]",
    ]);
  });

  it("stores its own copy of an inspector event a custom writer mutates later", async () => {
    const inner = memoryWriter();
    const forwarded: PersistedInspectEvent[] = [];
    const forwarding: TraceWriter = {
      async write(event) {
        forwarded.push(event);
        await inner.write(event);
      },
    };
    const inspector = createInspector({ writer: forwarding });

    await inspector.run("forwarded-run", async () => "ok", { runId: "run_forwarded" });
    await inspector.flush();
    for (const event of forwarded) {
      event.name = "mutated-after-write";
    }

    expect(inner.getEvents().map((event) => event.name)).toEqual([
      "forwarded-run",
      "forwarded-run",
    ]);
  });

  it("still hands a redacted event to a custom child when written straight to compositeWriter", async () => {
    const received: PersistedInspectEvent[] = [];
    const child: TraceWriter = {
      async write(event) {
        received.push(event);
      },
    };

    await compositeWriter([child]).write({
      schemaVersion: "1.0",
      eventId: "direct_composite_event",
      runId: "run_direct_composite",
      kind: "TOOL",
      name: "direct-write",
      status: "ok",
      timestamp: "2026-06-24T00:00:00.000Z",
      confidence: "explicit",
      source: { type: "manual" },
      attributes: { metadata: sensitiveMetadata },
    });

    expect(received[0]?.attributes?.metadata).toMatchObject({
      email: "[REDACTED]",
      apiKey: "[REDACTED]",
    });
  });

  it("still redacts an event written straight to a writer the inspector also uses", async () => {
    const writer = memoryWriter();
    await recordSensitiveStep(writer);
    writer.clear();

    await writer.write({
      schemaVersion: "1.0",
      eventId: "direct_event",
      runId: "run_direct",
      kind: "TOOL",
      name: "direct-write",
      status: "ok",
      timestamp: "2026-06-24T00:00:00.000Z",
      confidence: "explicit",
      source: { type: "manual" },
      attributes: { metadata: sensitiveMetadata },
    });

    expect(writer.getEvents()[0]?.attributes?.metadata).toMatchObject({
      email: "[REDACTED]",
      apiKey: "[REDACTED]",
    });
  });
});
