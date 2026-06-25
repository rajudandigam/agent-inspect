import { describe, expect, it } from "vitest";

import {
  createInspectorRuntime,
  type InspectorRuntimeOptions,
} from "../src/inspector-runtime.js";
import type { ExecutionContext } from "../src/types.js";
import { resolveTraceSafetyOptions } from "../src/trace-event-safety.js";
import type { PersistedInspectEvent } from "../src/types/persisted-inspect-event.js";
import type { TraceWriter } from "../src/writers/index.js";
import { memoryWriter } from "../src/writers/index.js";

function context(overrides: Partial<ExecutionContext> = {}): ExecutionContext {
  return {
    runId: "run_runtime",
    runName: "runtime-run",
    traceDir: "/tmp/agent-inspect-runtime",
    silent: true,
    metadata: { correlationId: "corr-runtime" },
    ...overrides,
  };
}

function event(overrides: Partial<PersistedInspectEvent> = {}): PersistedInspectEvent {
  return {
    schemaVersion: "0.2",
    eventId: "event_runtime",
    runId: "run_runtime",
    kind: "LOGIC",
    name: "runtime-step",
    status: "ok",
    timestamp: "2026-06-25T00:00:00.000Z",
    confidence: "explicit",
    source: { type: "manual" },
    ...overrides,
  };
}

describe("createInspectorRuntime", () => {
  it("exposes instance-scoped context and clears it after run", async () => {
    const runtime = createInspectorRuntime();

    await runtime.runWithContext(context(), async () => {
      expect(runtime.getCurrentContext()).toEqual({
        runtimeId: runtime.runtimeId,
        runId: "run_runtime",
        runName: "runtime-run",
        traceDir: "/tmp/agent-inspect-runtime",
        silent: true,
        metadata: { correlationId: "corr-runtime" },
      });
      expect(runtime.getCurrentCorrelationMetadata()).toEqual({
        correlationId: "corr-runtime",
      });
      expect(runtime.getCurrentStepId()).toBeUndefined();
      expect(runtime.getCurrentDepth()).toBe(0);
    });

    expect(runtime.getCurrentContext()).toBeUndefined();
    expect(runtime.getCurrentDepth()).toBe(0);
  });

  it("isolates concurrent runtime instances", async () => {
    const first = createInspectorRuntime();
    const second = createInspectorRuntime();

    const result = await Promise.all([
      first.runWithContext(context({ runId: "run_a", runName: "a" }), async () => {
        await new Promise<void>((resolve) => setTimeout(resolve, 10));
        return {
          first: first.getCurrentContext()?.runId,
          second: second.getCurrentContext()?.runId,
        };
      }),
      second.runWithContext(context({ runId: "run_b", runName: "b" }), async () => {
        await new Promise<void>((resolve) => setTimeout(resolve, 5));
        return {
          first: first.getCurrentContext()?.runId,
          second: second.getCurrentContext()?.runId,
        };
      }),
    ]);

    expect(result).toEqual([
      { first: "run_a", second: undefined },
      { first: undefined, second: "run_b" },
    ]);
  });

  it("restores parent step context after nested and parallel branches", async () => {
    const runtime = createInspectorRuntime();

    await runtime.runWithContext(context(), async () => {
      await runtime.runWithStepContext("step_parent", async () => {
        expect(runtime.getCurrentStepId()).toBe("step_parent");
        expect(runtime.getCurrentDepth()).toBe(1);

        const branches = await Promise.all([
          runtime.runWithStepContext("step_a", async () => {
            await new Promise<void>((resolve) => setTimeout(resolve, 10));
            return {
              stepId: runtime.getCurrentStepId(),
              depth: runtime.getCurrentDepth(),
            };
          }),
          runtime.runWithStepContext("step_b", async () => {
            await new Promise<void>((resolve) => setTimeout(resolve, 5));
            return {
              stepId: runtime.getCurrentStepId(),
              depth: runtime.getCurrentDepth(),
            };
          }),
        ]);

        expect(branches).toContainEqual({ stepId: "step_a", depth: 2 });
        expect(branches).toContainEqual({ stepId: "step_b", depth: 2 });
        expect(runtime.getCurrentStepId()).toBe("step_parent");
        expect(runtime.getCurrentDepth()).toBe(1);
      });

      expect(runtime.getCurrentStepId()).toBeUndefined();
      expect(runtime.getCurrentDepth()).toBe(0);
    });
  });

  it("preserves application return values and errors", async () => {
    const runtime = createInspectorRuntime();
    const appError = new Error("application failed");

    await expect(
      runtime.runWithContext(context(), async () => "ok"),
    ).resolves.toBe("ok");
    await expect(
      runtime.runWithContext(context(), async () => {
        throw appError;
      }),
    ).rejects.toBe(appError);
  });

  it("supports disabled passthrough without activating context or writing", async () => {
    const writer = memoryWriter();
    const runtime = createInspectorRuntime({ enabled: false, writer });

    const result = await runtime.runWithContext(context(), async () => {
      expect(runtime.getCurrentContext()).toBeUndefined();
      await runtime.write(event());
      return "disabled";
    });

    expect(result).toBe("disabled");
    expect(writer.getEvents()).toEqual([]);
  });

  it("writes through the configured writer and surfaces diagnostics", async () => {
    const writer = memoryWriter();
    const runtime = createInspectorRuntime({ writer });

    await runtime.write(event({ eventId: "before" }));
    await runtime.flush();
    await runtime.close();
    await runtime.close();

    expect(writer.getEvents().map((stored) => stored.eventId)).toEqual(["before"]);
    expect(runtime.getDiagnostics()).toEqual({
      instrumentationErrors: 0,
      writerStats: {
        writtenEvents: 1,
        droppedEvents: 0,
        flushCount: 1,
        lastFlushAt: expect.any(String),
      },
    });
  });

  it("isolates writer failures from callers", async () => {
    const failingWriter: TraceWriter = {
      async write() {
        throw new Error("write failed");
      },
      async flush() {
        throw new Error("flush failed");
      },
      async close() {
        throw new Error("close failed");
      },
    };
    const runtime = createInspectorRuntime({ writer: failingWriter });

    await expect(runtime.write(event())).resolves.toBeUndefined();
    await expect(runtime.flush()).resolves.toBeUndefined();
    await expect(runtime.close()).resolves.toBeUndefined();

    expect(runtime.getDiagnostics()).toEqual({
      instrumentationErrors: 3,
      lastInstrumentationError: "close failed",
    });
  });

  it("exposes configured trace safety settings", () => {
    const traceSafety = resolveTraceSafetyOptions({
      redactionProfile: "share",
      maxEventBytes: 1024,
      maxMetadataValueLength: 128,
      maxPreviewLength: 64,
    });
    const options: InspectorRuntimeOptions = {
      traceSafety,
    };
    const runtime = createInspectorRuntime(options);

    expect(runtime.getTraceSafety()).toEqual(options.traceSafety);
  });
});
