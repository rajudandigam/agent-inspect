import { mkdir, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { hasActiveContext } from "../src/context.js";
import { inspectRun } from "../src/inspect-run.js";
import * as storage from "../src/storage.js";
import { step } from "../src/step.js";
import { MAX_NAME_LENGTH } from "../src/utils.js";
import type { StepStartedEvent, TraceEvent } from "../src/types.js";

async function readRunEvents(traceDir: string): Promise<TraceEvent[]> {
  const files = await readdir(traceDir);
  const jsonl = files.find((f) => f.endsWith(".jsonl"));
  if (!jsonl) return [];
  const runId = jsonl.replace(/\.jsonl$/, "");
  return storage.readTraceEvents(runId, traceDir);
}

function stepStarted(
  events: TraceEvent[],
  name: string,
): StepStartedEvent | undefined {
  return events.find(
    (e): e is StepStartedEvent => e.event === "step_started" && e.name === name,
  );
}

describe("step", () => {
  let traceDir: string;

  beforeEach(async () => {
    traceDir = path.join(os.tmpdir(), `agent-inspect-step-${Date.now()}`);
    await mkdir(traceDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await rm(traceDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
    vi.restoreAllMocks();
  });

  it("succeeds inside inspectRun and writes trace", async () => {
    const result = await inspectRun(
      "test-run",
      async () => {
        return step("test-step", async () => "step-result");
      },
      { traceDir, silent: true },
    );
    expect(result).toBe("step-result");

    const events = await readRunEvents(traceDir);
    expect(events.map((e) => e.event)).toEqual([
      "run_started",
      "step_started",
      "step_completed",
      "run_completed",
    ]);
    const st = stepStarted(events, "test-step");
    expect(st?.name).toBe("test-step");
    expect(st?.type).toBe("logic");
    const done = events.find(
      (e) => e.event === "step_completed" && e.stepId === st?.stepId,
    );
    expect(done?.event === "step_completed" && done.status).toBe("success");
    if (done?.event === "step_completed") {
      expect(Number.isFinite(done.durationMs)).toBe(true);
    }
  });

  it("supports sync fn", async () => {
    const r = await inspectRun(
      "r",
      async () => step("sync-step", () => "sync"),
      { traceDir, silent: true },
    );
    expect(r).toBe("sync");
  });

  it("captures step error and rethrows; run ends in error", async () => {
    const originalError = new Error("step failed");
    await expect(
      inspectRun(
        "r",
        async () => {
          await step("bad-step", async () => {
            throw originalError;
          });
        },
        { traceDir, silent: true },
      ),
    ).rejects.toBe(originalError);

    const events = await readRunEvents(traceDir);
    const stepDone = events.find(
      (e) => e.event === "step_completed" && e.status === "error",
    );
    expect(stepDone?.event === "step_completed" && stepDone.error?.message).toBe(
      "step failed",
    );
    const runDone = events.filter((e) => e.event === "run_completed").pop();
    expect(runDone?.event === "run_completed" && runDone.status).toBe("error");
  });

  it("throws TypeError for invalid fn inside inspectRun", async () => {
    let caught: unknown;
    try {
      await inspectRun(
        "r",
        async () => {
          await step("bad", undefined as unknown as () => string);
        },
        { traceDir, silent: true },
      );
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(TypeError);
    const msg = String((caught as Error).message);
    expect(msg).toMatch(/step/i);
    expect(msg).toMatch(/function/i);
  });

  it("normalizes blank step name", async () => {
    await inspectRun(
      "r",
      async () => step("", async () => "ok"),
      { traceDir, silent: true },
    );
    const events = await readRunEvents(traceDir);
    expect(stepStarted(events, "unnamed-step")).toBeDefined();
  });

  it("supports custom step type", async () => {
    await inspectRun(
      "r",
      async () =>
        step("choose-action", async () => "route-a", { type: "decision" }),
      { traceDir, silent: true },
    );
    const events = await readRunEvents(traceDir);
    expect(stepStarted(events, "choose-action")?.type).toBe("decision");
  });

  it("supports custom metadata", async () => {
    await inspectRun(
      "r",
      async () =>
        step("with-meta", async () => "ok", {
          metadata: { retryCount: 2 },
        }),
      { traceDir, silent: true },
    );
    const events = await readRunEvents(traceDir);
    const st = stepStarted(events, "with-meta");
    expect(st?.metadata?.retryCount).toBe(2);
  });

  it("nested steps set parentId", async () => {
    await inspectRun(
      "nested",
      async () => {
        await step("parent", async () => {
          await step("child", async () => "child-result");
        });
      },
      { traceDir, silent: true },
    );
    const events = await readRunEvents(traceDir);
    const parent = stepStarted(events, "parent");
    const child = stepStarted(events, "child");
    expect(parent?.parentId).toBeUndefined();
    expect(child?.parentId).toBe(parent?.stepId);
  });

  it("deeper nesting sets grandchild parentId", async () => {
    await inspectRun(
      "r",
      async () => {
        await step("parent", async () => {
          await step("child", async () => {
            await step("grand", async () => "g");
          });
        });
      },
      { traceDir, silent: true },
    );
    const events = await readRunEvents(traceDir);
    const p = stepStarted(events, "parent");
    const c = stepStarted(events, "child");
    const g = stepStarted(events, "grand");
    expect(c?.parentId).toBe(p?.stepId);
    expect(g?.parentId).toBe(c?.stepId);
  });

  it("Promise.all siblings share parent stepId as parentId", async () => {
    await inspectRun(
      "parallel",
      async () => {
        await step("parent", async () => {
          await Promise.all([
            step("a", async () => {
              await new Promise<void>((r) => {
                setTimeout(r, 10);
              });
              return "a";
            }),
            step("b", async () => {
              await new Promise<void>((r) => {
                setTimeout(r, 5);
              });
              return "b";
            }),
          ]);
        });
      },
      { traceDir, silent: true },
    );
    const events = await readRunEvents(traceDir);
    const parent = stepStarted(events, "parent");
    const a = stepStarted(events, "a");
    const b = stepStarted(events, "b");
    expect(a?.parentId).toBe(parent?.stepId);
    expect(b?.parentId).toBe(parent?.stepId);
    expect(a?.parentId).not.toBe(b?.stepId);
    expect(b?.parentId).not.toBe(a?.stepId);
  });

  it("outside inspectRun warns and runs fn without trace", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = await step("orphan", async () => "ok");
    expect(result).toBe("ok");
    expect(warnSpy.mock.calls.some((c) => String(c[0]).includes("outside inspectRun"))).toBe(
      true,
    );
    warnSpy.mockRestore();
  });

  it("step.llm sets name type and model metadata", async () => {
    await inspectRun(
      "r",
      async () => step.llm("gpt-4.1", async () => "response"),
      { traceDir, silent: true },
    );
    const events = await readRunEvents(traceDir);
    const st = stepStarted(events, "llm:gpt-4.1");
    expect(st?.type).toBe("llm");
    expect(st?.metadata?.model).toBe("gpt-4.1");
  });

  it("step.llm blank model uses unknown-model", async () => {
    await inspectRun(
      "r",
      async () => step.llm("", async () => "response"),
      { traceDir, silent: true },
    );
    const events = await readRunEvents(traceDir);
    const st = stepStarted(events, "llm:unknown-model");
    expect(st?.metadata?.model).toBe("unknown-model");
  });

  it("step.tool sets name type and toolName metadata", async () => {
    await inspectRun(
      "r",
      async () => step.tool("searchHotels", async () => []),
      { traceDir, silent: true },
    );
    const events = await readRunEvents(traceDir);
    const st = stepStarted(events, "tool:searchHotels");
    expect(st?.type).toBe("tool");
    expect(st?.metadata?.toolName).toBe("searchHotels");
  });

  it("step.tool blank name uses unknown-tool", async () => {
    await inspectRun(
      "r",
      async () => step.tool("", async () => []),
      { traceDir, silent: true },
    );
    const events = await readRunEvents(traceDir);
    const st = stepStarted(events, "tool:unknown-tool");
    expect(st?.metadata?.toolName).toBe("unknown-tool");
  });

  it("prints when silent is false", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await inspectRun(
      "r",
      async () => step("my-step", async () => 1),
      { traceDir, silent: false },
    );
    const joined = spy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(joined).toContain("AgentInspect");
    expect(joined).toContain("my-step");
    expect(joined).toContain("Completed in");
    expect(joined).toContain("Trace:");
    spy.mockRestore();
  });

  it("returns user result when console.log throws", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {
      throw new Error("log broken");
    });
    const r = await inspectRun(
      "r",
      async () => step("s", async () => 99),
      { traceDir, silent: false },
    );
    expect(r).toBe(99);
  });

  it("returns user result when writeTraceEvent rejects", async () => {
    vi.spyOn(storage, "writeTraceEvent").mockImplementation(() =>
      Promise.reject(new Error("down")),
    );
    const r = await inspectRun(
      "r",
      async () => step("x", async () => "still"),
      { traceDir, silent: true },
    );
    expect(r).toBe("still");
  });

  it("clears context after inspectRun with nested steps", async () => {
    await inspectRun(
      "r",
      async () => {
        await step("p", async () => {
          await step("c", async () => {});
        });
      },
      { traceDir, silent: true },
    );
    expect(hasActiveContext()).toBe(false);
  });

  it("truncates long step name in trace", async () => {
    const long = "y".repeat(MAX_NAME_LENGTH + 40);
    await inspectRun(
      "r",
      async () => step(long, async () => null),
      { traceDir, silent: true },
    );
    const events = await readRunEvents(traceDir);
    const st = events.find(
      (e): e is StepStartedEvent =>
        e.event === "step_started" && e.name.startsWith("y") && e.name.endsWith("..."),
    );
    expect(st?.name.length).toBe(MAX_NAME_LENGTH);
  });
});
