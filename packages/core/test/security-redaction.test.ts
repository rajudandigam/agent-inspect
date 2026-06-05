import { mkdir, readdir, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { compactAttributes } from "../src/exporters/helpers.js";
import { inspectRun } from "../src/inspect-run.js";
import { Redactor } from "../src/logs/redactor.js";
import { step } from "../src/step.js";
import * as storage from "../src/storage.js";
import type { TraceEvent } from "../src/types.js";

async function readRunStarted(traceDir: string): Promise<TraceEvent | undefined> {
  const files = await readdir(traceDir);
  const jsonl = files.find((f) => f.endsWith(".jsonl"));
  if (!jsonl) return undefined;
  const raw = await readFile(path.join(traceDir, jsonl), "utf-8");
  const line = raw.split("\n").find((l) => l.includes("run_started"));
  if (!line?.trim()) return undefined;
  return JSON.parse(line.trim()) as TraceEvent;
}

async function readStepStarted(traceDir: string): Promise<TraceEvent | undefined> {
  const files = await readdir(traceDir);
  const jsonl = files.find((f) => f.endsWith(".jsonl"));
  if (!jsonl) return undefined;
  const runId = jsonl.replace(/\.jsonl$/, "");
  const events = await storage.readTraceEvents(runId, traceDir);
  return events.find((e) => e.event === "step_started");
}

describe("security/redaction expectations", () => {
  let traceDir: string;

  beforeEach(async () => {
    traceDir = path.join(os.tmpdir(), `agent-inspect-redact-${Date.now()}`);
    await mkdir(traceDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await rm(traceDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  });

  it("Redactor default keys redact common secrets (including nested)", () => {
    const r = new Redactor();
    const out = r.redactRecord({
      token: "t",
      nested: { password: "p", apiKey: "k" },
      ok: 1,
    });
    expect(out.token).toBe("[REDACTED]");
    expect((out.nested as Record<string, unknown>).password).toBe("[REDACTED]");
    expect((out.nested as Record<string, unknown>).apiKey).toBe("[REDACTED]");
    expect(out.ok).toBe(1);
  });

  it("export attribute compaction redacts by key substring when redacted=true", () => {
    const attrs = compactAttributes(
      {
        Authorization: "bearer x",
        apiKey: "k",
        emailAddress: "x@example.test",
        safe: "ok",
      },
      { redacted: true, maxLength: 500 },
    );
    expect(attrs.Authorization).toBe("[REDACTED]");
    expect(attrs.apiKey).toBe("[REDACTED]");
    expect(attrs.emailAddress).toBe("[REDACTED]");
    expect(attrs.safe).toBe("ok");
  });

  it("inspectRun metadata email redacted before disk", async () => {
    await inspectRun(
      "email-run",
      async () => "ok",
      {
        traceDir,
        silent: true,
        metadata: { email: "user@example.test", environment: "dev" },
      },
    );
    const started = await readRunStarted(traceDir);
    expect(started?.event).toBe("run_started");
    if (started?.event === "run_started") {
      expect(started.metadata?.email).toBe("[REDACTED]");
      expect(started.metadata?.environment).toBe("dev");
    }
  });

  it("inspectRun metadata token redacted before disk", async () => {
    await inspectRun(
      "token-run",
      async () => "ok",
      { traceDir, silent: true, metadata: { token: "secret-token" } },
    );
    const started = await readRunStarted(traceDir);
    if (started?.event === "run_started") {
      expect(started.metadata?.token).toBe("[REDACTED]");
    }
  });

  it("inspectRun metadata apiKey redacted before disk", async () => {
    await inspectRun(
      "api-run",
      async () => "ok",
      { traceDir, silent: true, metadata: { apiKey: "sk-live-123" } },
    );
    const started = await readRunStarted(traceDir);
    if (started?.event === "run_started") {
      expect(started.metadata?.apiKey).toBe("[REDACTED]");
    }
  });

  it("inspectRun nested metadata redacted", async () => {
    await inspectRun(
      "nested-run",
      async () => "ok",
      {
        traceDir,
        silent: true,
        metadata: {
          config: { password: "p", region: "us-east-1" },
        },
      },
    );
    const started = await readRunStarted(traceDir);
    if (started?.event === "run_started") {
      const config = started.metadata?.config as Record<string, unknown>;
      expect(config.password).toBe("[REDACTED]");
      expect(config.region).toBe("us-east-1");
    }
  });

  it("inspectRun redact false preserves metadata", async () => {
    await inspectRun(
      "opt-out",
      async () => "ok",
      {
        traceDir,
        silent: true,
        redact: false,
        metadata: { token: "visible-token", apiKey: "visible-key" },
      },
    );
    const started = await readRunStarted(traceDir);
    if (started?.event === "run_started") {
      expect(started.metadata?.token).toBe("visible-token");
      expect(started.metadata?.apiKey).toBe("visible-key");
    }
  });

  it("custom redaction rule works", async () => {
    await inspectRun(
      "custom-rule",
      async () => "ok",
      {
        traceDir,
        silent: true,
        redact: { rules: ["userUuid"] },
        metadata: { userUuid: "uuid-123", token: "still-redacted" },
      },
    );
    const started = await readRunStarted(traceDir);
    if (started?.event === "run_started") {
      expect(started.metadata?.userUuid).toBe("[REDACTED]");
      expect(started.metadata?.token).toBe("[REDACTED]");
    }
  });

  it("step metadata is redacted before disk", async () => {
    await inspectRun(
      "step-meta",
      async () =>
        step("with-meta", async () => "ok", {
          metadata: { secret: "shh", toolVersion: "1.0" },
        }),
      { traceDir, silent: true },
    );
    const stepStart = await readStepStarted(traceDir);
    expect(stepStart?.event).toBe("step_started");
    if (stepStart?.event === "step_started") {
      expect(stepStart.metadata?.secret).toBe("[REDACTED]");
      expect(stepStart.metadata?.toolVersion).toBe("1.0");
    }
  });
});
