/**
 * 6.14.2-6 — one credential-key policy across check and redact surfaces.
 */
import { describe, expect, it } from "vitest";

import { createSafetyRedactionRule, runTraceChecks } from "../src/checks/index.js";
import { isCredentialSensitiveKey } from "../src/safety/sensitive-key.js";
import type { TraceReadResult } from "../src/readers/index.js";
import type { InspectNode, InspectRunTree } from "../src/types/inspect-event.js";
import type { PersistedInspectEvent } from "../src/types/persisted-inspect-event.js";

function persisted(
  eventId: string,
  overrides: Partial<PersistedInspectEvent> = {},
): PersistedInspectEvent {
  return {
    schemaVersion: "0.2",
    eventId,
    runId: "run-parity",
    kind: "LLM",
    name: "llm",
    status: "ok",
    timestamp: "2026-08-07T00:00:01.000Z",
    confidence: "explicit",
    source: { type: "manual" },
    ...overrides,
  };
}

function readResult(events: readonly PersistedInspectEvent[]): TraceReadResult {
  const children: InspectNode[] = events.map((event) => ({
    event: {
      eventId: event.eventId,
      runId: event.runId,
      parentId: event.parentId,
      kind: event.kind,
      name: event.name,
      status: event.status === "unknown" ? undefined : event.status,
      timestamp: Date.parse(event.timestamp),
      durationMs: event.durationMs,
      attributes: event.attributes,
      confidence: event.confidence,
      source: { type: "manual" as const },
    },
    children: [],
    depth: 0,
  }));
  const run: InspectRunTree = {
    runId: "run-parity",
    name: "parity",
    status: "ok",
    children,
    metadata: {
      totalEvents: children.length,
      confidenceBreakdown: {
        explicit: children.length,
        correlated: 0,
        heuristic: 0,
        unknown: 0,
      },
      kinds: {
        RUN: 0,
        AGENT: 0,
        LLM: children.length,
        TOOL: 0,
        CHAIN: 0,
        RETRIEVER: 0,
        DECISION: 0,
        RESULT: 0,
        ERROR: 0,
        LOGIC: 0,
        LOG: 0,
        OUTCOME: 0,
      },
    },
  };
  return {
    format: "agent-inspect-jsonl",
    events: [...events],
    runs: [run],
    warnings: [],
    unsupportedFields: [],
    sourceFiles: [],
  };
}

describe("safety surface parity (6.14.2-6)", () => {
  it("agrees that config token keys are safe and access_token is not", () => {
    expect(isCredentialSensitiveKey("ls_max_tokens")).toBe(false);
    expect(isCredentialSensitiveKey("access_token")).toBe(true);

    const safe = runTraceChecks(
      {
        read: readResult([
          persisted("safe", {
            attributes: { ls_max_tokens: "undefined", max_tokens: 4096 },
          }),
        ]),
      },
      { rules: [createSafetyRedactionRule()] },
    );
    expect(safe.findings.filter((f) => f.ruleId === "safety.redaction")).toHaveLength(0);

    const unsafe = runTraceChecks(
      {
        read: readResult([
          persisted("unsafe", { attributes: { access_token: "secret-value" } }),
        ]),
      },
      { rules: [createSafetyRedactionRule()] },
    );
    expect(unsafe.findings.some((f) => f.ruleId === "safety.redaction")).toBe(true);
  });

  it("flags camelCase compound credentials without flagging maxTokens (#239)", () => {
    expect(isCredentialSensitiveKey("userPassword")).toBe(true);
    expect(isCredentialSensitiveKey("clientSecret")).toBe(true);
    expect(isCredentialSensitiveKey("maxTokens")).toBe(false);
    expect(isCredentialSensitiveKey("emailNote")).toBe(false);

    const findings = runTraceChecks(
      {
        read: readResult([
          persisted("camel", {
            attributes: {
              userPassword: "hunter2",
              clientSecret: "sk-abc",
              maxTokens: 2048,
            },
          }),
        ]),
      },
      { rules: [createSafetyRedactionRule()] },
    ).findings.filter((f) => f.ruleId === "safety.redaction");

    const paths = findings.flatMap((f) => [
      f.message,
      ...f.evidence.map((e) => e.path ?? ""),
      typeof f.actual === "object" && f.actual && "path" in f.actual
        ? String((f.actual as { path?: string }).path ?? "")
        : "",
    ]);
    expect(paths.some((p) => p.includes("userPassword"))).toBe(true);
    expect(paths.some((p) => p.includes("clientSecret"))).toBe(true);
    expect(paths.some((p) => p.includes("maxTokens"))).toBe(false);
  });
});
