import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  getRunIdFromTraceFileName,
  listTraceFiles,
  readTraceEvents,
} from "agent-inspect";
import { describe, expect, it } from "vitest";

import {
  createFixtureRunner,
  defineTarget,
  HarnessError,
  HarnessTargetNotFoundError,
} from "../src/index.js";
import type { FixtureRunner, FixtureTargets } from "../src/index.js";

interface TestApp {
  agent: {
    run(input: { question: string }): Promise<string>;
  };
  events: string[];
}

describe("@agent-inspect/harness", () => {
  it("lists targets deterministically with safe metadata", () => {
    const runner = createFixtureRunner({
      targets: {
        zed: defineTarget<undefined, () => string, undefined, string>({
          description: "last target",
          metadata: { family: "unit" },
          resolve: () => () => "zed",
          invoke: (target) => target(),
        }),
        alpha: defineTarget<undefined, () => string, undefined, string>({
          resolve: () => () => "alpha",
          invoke: (target) => target(),
        }),
      },
    });

    expect(runner.listTargets()).toEqual([
      { name: "alpha" },
      { name: "zed", description: "last target", metadata: { family: "unit" } },
    ]);
  });

  it("bootstraps, resolves, invokes, and shuts down a target", async () => {
    const app: TestApp = {
      agent: {
        async run(input) {
          app.events.push(`run:${input.question}`);
          return `answer:${input.question}`;
        },
      },
      events: [],
    };
    const runner = createFixtureRunner({
      name: "unit-harness",
      trace: { mode: "off" },
      targets: {
        ask: defineTarget<TestApp, TestApp["agent"], { question: string }, string>({
          description: "question runner",
          resolve(resolvedApp) {
            resolvedApp.events.push("resolve");
            return resolvedApp.agent;
          },
          invoke(target, input) {
            return target.run(input);
          },
        }),
      },
      bootstrap() {
        app.events.push("bootstrap");
        return app;
      },
      shutdown(resolvedApp) {
        resolvedApp?.events.push("shutdown");
      },
    });

    await expect(runner.runTarget("ask", { question: "hello" })).resolves.toBe(
      "answer:hello",
    );
    expect(app.events).toEqual([
      "bootstrap",
      "resolve",
      "run:hello",
      "shutdown",
    ]);
    expect(runner.getDiagnostics()).toEqual([]);
  });

  it("records deterministic diagnostics for missing targets", async () => {
    const runner = createFixtureRunner({
      targets: {
        known: defineTarget<undefined, () => string, undefined, string>({
          resolve: () => () => "ok",
          invoke: (target) => target(),
        }),
      },
    }) as FixtureRunner<undefined, FixtureTargets<undefined>>;

    await expect(runner.runTarget("missing", undefined)).rejects.toBeInstanceOf(
      HarnessTargetNotFoundError,
    );

    expect(runner.getDiagnostics()).toMatchObject([
      {
        code: "target_not_found",
        severity: "error",
        message: 'Harness target "missing" was not found.',
        targetName: "missing",
      },
    ]);
  });

  it("preserves invocation errors and still runs shutdown", async () => {
    const app: TestApp = {
      agent: {
        async run() {
          app.events.push("run");
          throw new Error("boom");
        },
      },
      events: [],
    };
    const runner = createFixtureRunner({
      trace: { mode: "off" },
      targets: {
        ask: defineTarget<TestApp, TestApp["agent"], { question: string }, string>({
          resolve: (resolvedApp) => resolvedApp.agent,
          invoke: (target, input) => target.run(input),
        }),
      },
      bootstrap: () => app,
      shutdown(resolvedApp) {
        resolvedApp?.events.push("shutdown");
      },
    });

    await expect(runner.runTarget("ask", { question: "ignored" })).rejects.toThrow(
      "boom",
    );
    expect(app.events).toEqual(["run", "shutdown"]);
    expect(runner.getDiagnostics()).toMatchObject([
      {
        code: "invoke_failed",
        severity: "error",
        targetName: "ask",
        error: { message: "boom" },
      },
    ]);
  });

  it("surfaces shutdown failure after a successful target", async () => {
    const runner = createFixtureRunner({
      trace: { mode: "off" },
      targets: {
        ok: defineTarget<undefined, () => string, undefined, string>({
          resolve: () => () => "ok",
          invoke: (target) => target(),
        }),
      },
      shutdown() {
        throw new Error("close failed");
      },
    });

    await expect(runner.runTarget("ok", undefined)).rejects.toBeInstanceOf(
      HarnessError,
    );
    expect(runner.getDiagnostics()).toMatchObject([
      {
        code: "shutdown_failed",
        severity: "error",
        targetName: "ok",
        error: { message: "close failed" },
      },
    ]);
  });

  it("writes local traces only when explicitly enabled", async () => {
    const traceDir = await mkdtemp(
      path.join(os.tmpdir(), "agent-inspect-harness-"),
    );
    const runner = createFixtureRunner({
      name: "trace-harness",
      trace: { mode: "run", enabled: true, traceDir, silent: true },
      targets: {
        echo: defineTarget<undefined, () => string, undefined, string>({
          resolve: () => () => "ok",
          invoke: (target) => target(),
        }),
      },
    });

    await expect(runner.runTarget("echo", undefined)).resolves.toBe("ok");

    const files = await listTraceFiles(traceDir);
    expect(files).toHaveLength(1);
    const traceFile = files[0];
    if (traceFile === undefined) {
      throw new Error("Expected harness trace file to be written.");
    }
    const runId = getRunIdFromTraceFileName(traceFile);
    if (runId === undefined) {
      throw new Error("Expected harness trace filename to contain a run id.");
    }
    const events = await readTraceEvents(runId, traceDir);
    expect(events).toMatchObject([
      { event: "run_started", name: "trace-harness:echo" },
      { event: "run_completed", status: "success" },
    ]);
  });
});
