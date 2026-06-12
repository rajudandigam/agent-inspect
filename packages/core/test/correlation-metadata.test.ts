import { mkdir, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  buildRunStartedMetadata,
  extractCorrelationMetadata,
} from "../src/correlation-metadata.js";
import {
  getCurrentCorrelationMetadata,
  hasActiveContext,
} from "../src/context.js";
import { inspectRun } from "../src/inspect-run.js";
import { maybeInspectRun } from "../src/maybe-inspect-run.js";
import { traceEventToPersistedInspectEvent } from "../src/persisted/from-trace-event.js";
import * as storage from "../src/storage.js";
import { isPersistedInspectEvent } from "../src/types/persisted-inspect-event.js";
import type { TraceEvent } from "../src/types.js";

describe("correlation metadata helpers", () => {
  it("buildRunStartedMetadata returns undefined when no fields", () => {
    expect(buildRunStartedMetadata()).toBeUndefined();
    expect(buildRunStartedMetadata({})).toBeUndefined();
  });

  it("extractCorrelationMetadata ignores empty strings", () => {
    expect(
      extractCorrelationMetadata({ correlationId: "", requestId: "r1" }),
    ).toEqual({ requestId: "r1" });
  });
});

describe("inspectRun correlation metadata", () => {
  let traceDir: string;

  beforeEach(async () => {
    traceDir = path.join(os.tmpdir(), `agent-inspect-corr-${Date.now()}`);
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

  it("writes correlationId on run_started metadata", async () => {
    await inspectRun("corr", async () => "ok", {
      traceDir,
      silent: true,
      correlationId: "corr-abc",
    });
    const start = await readRunStarted();
    expect(start?.metadata?.correlationId).toBe("corr-abc");
  });

  it("writes requestId, decisionId, and groupId on run_started metadata", async () => {
    await inspectRun("corr", async () => "ok", {
      traceDir,
      silent: true,
      requestId: "req-1",
      decisionId: "dec-2",
      groupId: "grp-3",
    });
    const start = await readRunStarted();
    expect(start?.metadata).toEqual({
      requestId: "req-1",
      decisionId: "dec-2",
      groupId: "grp-3",
    });
  });

  it("top-level correlation fields override options.metadata keys", async () => {
    await inspectRun("corr", async () => "ok", {
      traceDir,
      silent: true,
      correlationId: "top-level",
      metadata: { correlationId: "from-meta", environment: "test" },
    });
    const start = await readRunStarted();
    expect(start?.metadata).toEqual({
      correlationId: "top-level",
      environment: "test",
    });
  });

  it("omits correlation metadata when no fields are provided", async () => {
    await inspectRun("corr", async () => "ok", { traceDir, silent: true });
    const start = await readRunStarted();
    expect(start?.metadata).toBeUndefined();
  });

  it("enabled:false writes no trace even with correlation fields", async () => {
    await inspectRun(
      "off",
      async () => {
        expect(getCurrentCorrelationMetadata()).toBeUndefined();
        expect(hasActiveContext()).toBe(false);
        return "ok";
      },
      { traceDir, enabled: false, correlationId: "ignored" },
    );
    const files = await readdir(traceDir);
    expect(files.filter((f) => f.endsWith(".jsonl"))).toHaveLength(0);
  });

  it("rethrows user errors with correlation options", async () => {
    const err = new Error("boom");
    await expect(
      inspectRun(
        "err",
        async () => {
          throw err;
        },
        { traceDir, silent: true, correlationId: "corr-err" },
      ),
    ).rejects.toBe(err);
  });

  it("redacts sensitive metadata keys alongside correlation fields", async () => {
    await inspectRun("corr", async () => "ok", {
      traceDir,
      silent: true,
      correlationId: "corr-1",
      metadata: { token: "secret-token", environment: "ci" },
    });
    const start = await readRunStarted();
    expect(start?.metadata?.correlationId).toBe("corr-1");
    expect(start?.metadata?.environment).toBe("ci");
    expect(start?.metadata?.token).toBe("[REDACTED]");
  });

  it("exposes correlation metadata inside the run via getCurrentCorrelationMetadata", async () => {
    const inside = await inspectRun(
      "ctx",
      async () => getCurrentCorrelationMetadata(),
      {
        traceDir,
        silent: true,
        correlationId: "corr-in-run",
        requestId: "req-in-run",
      },
    );
    expect(inside).toEqual({
      correlationId: "corr-in-run",
      requestId: "req-in-run",
    });
    expect(getCurrentCorrelationMetadata()).toBeUndefined();
  });
});

describe("maybeInspectRun correlation metadata", () => {
  let traceDir: string;
  const prevAgentInspect = process.env.AGENT_INSPECT;

  beforeEach(async () => {
    traceDir = path.join(os.tmpdir(), `agent-inspect-maybe-corr-${Date.now()}`);
    await mkdir(traceDir, { recursive: true });
    delete process.env.AGENT_INSPECT;
  });

  afterEach(async () => {
    try {
      await rm(traceDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
    if (prevAgentInspect === undefined) {
      delete process.env.AGENT_INSPECT;
    } else {
      process.env.AGENT_INSPECT = prevAgentInspect;
    }
  });

  it("AGENT_INSPECT=1 with correlationId writes it", async () => {
    process.env.AGENT_INSPECT = "1";
    await maybeInspectRun("on", async () => "ok", {
      traceDir,
      silent: true,
      correlationId: "maybe-corr",
    });
    const files = await readdir(traceDir);
    const runId = files.find((f) => f.endsWith(".jsonl"))!.replace(/\.jsonl$/, "");
    const events = await storage.readTraceEvents(runId, traceDir);
    const start = events.find((e) => e.event === "run_started");
    expect(start?.event === "run_started" && start.metadata?.correlationId).toBe(
      "maybe-corr",
    );
  });

  it("AGENT_INSPECT unset writes no trace", async () => {
    delete process.env.AGENT_INSPECT;
    await maybeInspectRun("off", async () => "ok", {
      traceDir,
      silent: true,
      correlationId: "ignored",
    });
    const files = await readdir(traceDir);
    expect(files.filter((f) => f.endsWith(".jsonl"))).toHaveLength(0);
  });
});

describe("traceEventToPersistedInspectEvent correlation mapping", () => {
  const TS = 1_700_000_000_000;

  it("maps run_started correlation fields to attributes and metadata", () => {
    const event: TraceEvent = {
      schemaVersion: "0.1",
      event: "run_started",
      timestamp: TS,
      runId: "run_abc",
      name: "support-agent",
      startTime: TS,
      metadata: {
        correlationId: "corr-1",
        requestId: "req-2",
        decisionId: "dec-3",
        groupId: "grp-4",
      },
    };

    const out = traceEventToPersistedInspectEvent(event, { eventIndex: 0 });

    expect(out.attributes?.correlationId).toBe("corr-1");
    expect(out.attributes?.requestId).toBe("req-2");
    expect(out.attributes?.decisionId).toBe("dec-3");
    expect(out.attributes?.groupId).toBe("grp-4");
    expect(out.attributes?.metadata).toEqual({
      correlationId: "corr-1",
      requestId: "req-2",
      decisionId: "dec-3",
      groupId: "grp-4",
    });
    expect(isPersistedInspectEvent(out)).toBe(true);
  });
});
