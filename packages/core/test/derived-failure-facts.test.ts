import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { buildTraceFacts } from "../src/checks/trace-facts.js";
import { openTraceDirectory, openTraceFile } from "../src/readers/index.js";
import type { PersistedInspectEvent } from "../src/types/persisted-inspect-event.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

function event(
  partial: Omit<PersistedInspectEvent, "schemaVersion" | "confidence" | "source" | "timestamp"> &
    Partial<Pick<PersistedInspectEvent, "schemaVersion" | "confidence" | "source" | "timestamp">>,
): PersistedInspectEvent {
  return {
    schemaVersion: "0.2",
    confidence: "explicit",
    source: { type: "manual", name: "derived-failure-test" },
    timestamp: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

describe("6.19 derived failure roles", () => {
  it("marks explicit retryOf successor success as recovered", async () => {
    const dir = path.join(repoRoot, "fixtures/sessions/retry-attempts");
    const read = await openTraceDirectory(dir);
    const facts = buildTraceFacts(read);
    const failed = facts.failureFacts.filter((f) => f.runId === "retry-run-1");
    expect(failed.length).toBeGreaterThan(0);
    expect(failed.every((f) => f.role === "recovered")).toBe(true);
    expect(failed.every((f) => f.confidence === "explicit")).toBe(true);
  });

  it("marks in-run attempt progression recoveries from tool-retry-success", async () => {
    const read = await openTraceFile(
      path.join(repoRoot, "fixtures/traces/tool-retry-success.jsonl"),
    );
    const facts = buildTraceFacts(read);
    const recovered = facts.failureFacts.filter((f) => f.role === "recovered");
    expect(recovered.length).toBeGreaterThan(0);
    expect(facts.summary.failureRoleCounts?.recovered).toBeGreaterThan(0);
  });

  it("keeps same-name success under a different parent as unknown", () => {
    const facts = buildTraceFacts([
      event({
        eventId: "fail-1",
        runId: "run-a",
        parentId: "parent-a",
        kind: "TOOL",
        name: "tool:lookup",
        status: "error",
        attributes: { toolName: "lookup", attempt: 1 },
        timestamp: "2026-01-01T00:00:01.000Z",
      }),
      event({
        eventId: "ok-1",
        runId: "run-a",
        parentId: "parent-b",
        kind: "TOOL",
        name: "tool:lookup",
        status: "ok",
        attributes: { toolName: "lookup", attempt: 2 },
        timestamp: "2026-01-01T00:00:02.000Z",
      }),
    ]);
    expect(facts.failureFacts).toHaveLength(1);
    expect(facts.failureFacts[0]!.role).toBe("unknown");
  });

  it("marks declared but missing successor as transient", () => {
    const facts = buildTraceFacts([
      event({
        eventId: "fail-1",
        runId: "run-a",
        kind: "TOOL",
        name: "tool:lookup",
        status: "error",
        attributes: {
          toolName: "lookup",
          metadata: { retriedBy: "run-missing" },
        },
        timestamp: "2026-01-01T00:00:01.000Z",
      }),
    ]);
    expect(facts.failureFacts[0]).toMatchObject({
      role: "transient",
      confidence: "explicit",
    });
    expect(facts.failureFacts[0]!.retryRunIds).toContain("run-missing");
  });

  it("marks final explicit attempt with enclosing run error as terminal", () => {
    const facts = buildTraceFacts([
      event({
        eventId: "run-start",
        runId: "run-final",
        kind: "RUN",
        name: "job",
        status: "running",
        attributes: {
          metadata: { attempt: 2, retryOf: "run-prior", sessionId: "sess-1" },
        },
        timestamp: "2026-01-01T00:00:00.000Z",
      }),
      event({
        eventId: "fail-1",
        runId: "run-final",
        kind: "TOOL",
        name: "tool:lookup",
        status: "error",
        attributes: { toolName: "lookup", attempt: 2 },
        timestamp: "2026-01-01T00:00:01.000Z",
      }),
      event({
        eventId: "run-end",
        runId: "run-final",
        kind: "RUN",
        name: "run",
        status: "error",
        timestamp: "2026-01-01T00:00:02.000Z",
      }),
    ]);
    const toolFailure = facts.failureFacts.find((f) => f.eventId === "fail-1");
    expect(toolFailure?.role).toBe("terminal");
  });

  it("does not classify running events as terminal", () => {
    const facts = buildTraceFacts([
      event({
        eventId: "running-1",
        runId: "run-a",
        kind: "TOOL",
        name: "tool:lookup",
        status: "running",
        timestamp: "2026-01-01T00:00:01.000Z",
      }),
    ]);
    expect(facts.failureFacts).toHaveLength(0);
  });

  it("rejects raw v0.1 arrays without normalization", async () => {
    const raw = JSON.parse(
      (
        await readFile(path.join(repoRoot, "fixtures/traces/error-recovery.jsonl"), "utf8")
      ).split("\n")[0]!,
    );
    expect(() => buildTraceFacts([raw] as never)).toThrow(/openTraceFile|AI_TRACE_FACTS/);
  });

  it("orders failureFacts deterministically", () => {
    const facts = buildTraceFacts([
      event({
        eventId: "b",
        runId: "run-a",
        kind: "TOOL",
        name: "tool:b",
        status: "error",
        timestamp: "2026-01-01T00:00:02.000Z",
      }),
      event({
        eventId: "a",
        runId: "run-a",
        kind: "TOOL",
        name: "tool:a",
        status: "error",
        timestamp: "2026-01-01T00:00:01.000Z",
      }),
    ]);
    expect(facts.failureFacts.map((f) => f.eventId)).toEqual(["a", "b"]);
  });

  it("classifies ambiguous multi-run recoveries as unknown", () => {
    const facts = buildTraceFacts([
      event({
        eventId: "fail-1",
        runId: "run-a",
        kind: "RUN",
        name: "job",
        status: "error",
        timestamp: "2026-01-01T00:00:01.000Z",
      }),
      event({
        eventId: "run-b-start",
        runId: "run-b",
        kind: "RUN",
        name: "job",
        status: "ok",
        attributes: { metadata: { retryOf: "run-a" } },
        timestamp: "2026-01-01T00:00:02.000Z",
      }),
      event({
        eventId: "run-c-start",
        runId: "run-c",
        kind: "RUN",
        name: "job",
        status: "ok",
        attributes: { metadata: { retryOf: "run-a" } },
        timestamp: "2026-01-01T00:00:03.000Z",
      }),
    ]);
    expect(facts.failureFacts[0]!.role).toBe("unknown");
    expect(facts.failureFacts[0]!.basis).toContain("ambiguous-recovery-candidates");
  });
});
