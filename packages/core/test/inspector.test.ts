import { describe, expect, it } from "vitest";

import { createInspector } from "../src/inspector.js";
import { memoryWriter, type TraceWriter } from "../src/writers/index.js";

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
