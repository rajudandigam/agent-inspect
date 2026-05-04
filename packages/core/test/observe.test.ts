import { mkdir, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { observe } from "../src/observe.js";
import * as storage from "../src/storage.js";
import type { TraceEvent } from "../src/types.js";

async function readRunEvents(traceDir: string): Promise<TraceEvent[]> {
  const files = await readdir(traceDir);
  const jsonl = files.find((f) => f.endsWith(".jsonl"));
  if (!jsonl) return [];
  const runId = jsonl.replace(/\.jsonl$/, "");
  return storage.readTraceEvents(runId, traceDir);
}

describe("observe", () => {
  let traceDir: string;

  beforeEach(async () => {
    traceDir = path.join(os.tmpdir(), `agent-inspect-observe-${Date.now()}`);
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

  it("wraps run()", async () => {
    const agent = {
      async run(input: string) {
        return `Result: ${input}`;
      },
    };
    const observed = observe(agent, { traceDir, silent: true });
    const result = await observed.run("test");
    expect(result).toBe("Result: test");

    const files = await readdir(traceDir);
    expect(files.some((f) => f.endsWith(".jsonl"))).toBe(true);
    const events = await readRunEvents(traceDir);
    const started = events.find((e) => e.event === "run_started");
    expect(started?.event === "run_started" && started.name).toBe("Agent.run");
    const done = events.find((e) => e.event === "run_completed");
    expect(done?.event === "run_completed" && done.status).toBe("success");
  });

  it("wraps execute()", async () => {
    const agent = {
      async execute(input: string) {
        return `Exec: ${input}`;
      },
    };
    const observed = observe(agent, { traceDir, silent: true });
    await observed.execute("x");
    const events = await readRunEvents(traceDir);
    const started = events.find((e) => e.event === "run_started");
    expect(started?.event === "run_started" && started.name).toBe("Agent.execute");
  });

  it("wraps invoke()", async () => {
    const agent = {
      async invoke(input: string) {
        return `Inv: ${input}`;
      },
    };
    const observed = observe(agent, { traceDir, silent: true });
    await observed.invoke("y");
    const events = await readRunEvents(traceDir);
    const started = events.find((e) => e.event === "run_started");
    expect(started?.event === "run_started" && started.name).toBe("Agent.invoke");
  });

  it("uses class name in run name", async () => {
    class CustomerSupportAgent {
      async run(input: string) {
        return `Answer: ${input}`;
      }
    }
    const observed = observe(new CustomerSupportAgent(), {
      traceDir,
      silent: true,
    });
    await observed.run("hello");
    const events = await readRunEvents(traceDir);
    const started = events.find((e) => e.event === "run_started");
    expect(started?.event === "run_started" && started.name).toBe(
      "CustomerSupportAgent.run",
    );
  });

  it("preserves class private fields via apply(target)", async () => {
    class StatefulAgent {
      #state = "initial";

      run(input: string) {
        this.#state = "modified";
        return `${this.#state}:${input}`;
      }

      getState() {
        return this.#state;
      }
    }
    const observed = observe(new StatefulAgent(), { traceDir, silent: true });
    const result = await observed.run("x");
    expect(result).toBe("modified:x");
    expect(observed.getState()).toBe("modified");
  });

  it("preserves plain object this for run", async () => {
    const agent = {
      prefix: "P",
      run(input: string) {
        return `${this.prefix}:${input}`;
      },
    };
    const observed = observe(agent, { traceDir, silent: true });
    expect(await observed.run("x")).toBe("P:x");
  });

  it("does not wrap unrelated methods or create traces", async () => {
    const agent = {
      helper() {
        return "helper";
      },
    };
    const observed = observe(agent, { traceDir, silent: true });
    expect(observed.helper()).toBe("helper");
    const files = await readdir(traceDir);
    expect(files.filter((f) => f.endsWith(".jsonl"))).toHaveLength(0);
  });

  it("leaves non-function instrumentable property unchanged", () => {
    const agent = { run: "not-a-function" };
    const observed = observe(agent);
    expect(observed.run).toBe("not-a-function");
  });

  it("returns null for null input and warns", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const observed = observe(null, { traceDir, silent: true });
    expect(observed).toBeNull();
    const msg = String(warnSpy.mock.calls[0]?.[0] ?? "");
    expect(msg).toContain("[AgentInspect]");
    expect(msg).toContain("observe() requires an object");
    warnSpy.mockRestore();
  });

  it("returns primitive unchanged and warns", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const observed = observe("hello", { traceDir, silent: true });
    expect(observed).toBe("hello");
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("supports sync run via inspectRun (awaitable)", async () => {
    const agent = {
      run(input: string) {
        return `Sync:${input}`;
      },
    };
    const observed = observe(agent, { traceDir, silent: true });
    expect(await observed.run("x")).toBe("Sync:x");
    const events = await readRunEvents(traceDir);
    expect(events.some((e) => e.event === "run_started")).toBe(true);
  });

  it("rethrows original error and records run_completed error", async () => {
    const originalError = new Error("agent failed");
    const agent = {
      async run() {
        throw originalError;
      },
    };
    const observed = observe(agent, { traceDir, silent: true });
    await expect(observed.run()).rejects.toBe(originalError);
    const events = await readRunEvents(traceDir);
    const done = events.find((e) => e.event === "run_completed");
    expect(done?.event === "run_completed" && done.status).toBe("error");
    expect(done?.event === "run_completed" && done.error?.message).toBe("agent failed");
  });

  it("passes options through to inspectRun", async () => {
    const agent = {
      async run() {
        return 1;
      },
    };
    const observed = observe(agent, {
      traceDir,
      silent: true,
      metadata: { environment: "test" },
    });
    await observed.run();
    const events = await readRunEvents(traceDir);
    const started = events.find((e) => e.event === "run_started");
    expect(
      started?.event === "run_started" && started.metadata?.environment,
    ).toBe("test");
  });

  it("silent true avoids console.log", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const agent = { async run() {} };
    const observed = observe(agent, { traceDir, silent: true });
    await observed.run();
    expect(logSpy).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it("silent false prints run banner and trace line", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const agent = {
      async run() {
        return 1;
      },
    };
    const observed = observe(agent, { traceDir, silent: false });
    await observed.run();
    const joined = logSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(joined).toContain("AgentInspect");
    expect(joined).toContain("Agent.run");
    expect(joined).toContain("Completed in");
    expect(joined).toContain("Trace:");
    logSpy.mockRestore();
  });

  it("returns user result when storage writes fail", async () => {
    vi.spyOn(storage, "writeTraceEvent").mockRejectedValue(new Error("storage down"));
    const agent = {
      async run() {
        return "ok";
      },
    };
    const observed = observe(agent, { traceDir, silent: true });
    expect(await observed.run()).toBe("ok");
  });

  it("returns user result when console.log throws", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {
      throw new Error("log broken");
    });
    const agent = {
      async run() {
        return 42;
      },
    };
    const observed = observe(agent, { traceDir, silent: false });
    expect(await observed.run()).toBe(42);
  });

  it("wraps run added after observe()", async () => {
    const agent: { run?: () => string } = {};
    const observed = observe(agent, { traceDir, silent: true });
    agent.run = () => "later";
    expect(await observed.run!()).toBe("later");
    const events = await readRunEvents(traceDir);
    expect(events.some((e) => e.event === "run_started")).toBe(true);
  });
});
