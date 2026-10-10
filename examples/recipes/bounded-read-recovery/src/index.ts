/**
 * Flagship 6.27 bounded read-recovery oracle for retrieve_policy.
 * Synthetic in-memory traces only — no network.
 *
 * Outer harness exits 0 only when every case matches its expected classification.
 * Fixture-level deadline (100ms budget) is a declared recipe check, not a core
 * TraceContract field.
 */
import { defineTraceContract, evaluateTraceContract } from "agent-inspect/checks";
import type { TraceReadResult } from "agent-inspect/readers";

function event(eventId: string, overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: "0.2" as const,
    eventId,
    runId: "run-recovery",
    kind: "LOGIC" as const,
    name: eventId,
    status: "ok" as const,
    timestamp: "2026-09-12T10:00:00.000Z",
    confidence: "explicit" as const,
    source: { type: "manual" as const },
    ...overrides,
  };
}

function atMs(ms: number): string {
  const base = Date.parse("2026-09-12T10:00:00.000Z");
  return new Date(base + ms).toISOString();
}

function read(events: ReturnType<typeof event>[]): TraceReadResult {
  const children = events
    .filter((e) => e.kind !== "RUN")
    .map((e) => ({
      event: {
        eventId: e.eventId,
        runId: e.runId,
        kind: e.kind,
        name: e.name,
        status: e.status,
        timestamp: Date.parse(e.timestamp),
        attributes: e.attributes as Record<string, unknown> | undefined,
        confidence: e.confidence,
        source: { type: "manual" as const },
      },
      children: [] as never[],
      depth: 1,
    }));
  return {
    format: "agent-inspect-jsonl",
    runs: [
      {
        runId: "run-recovery",
        name: "run-recovery",
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
            LLM: children.filter((c) => c.event.kind === "LLM").length,
            TOOL: children.filter((c) => c.event.kind === "TOOL").length,
            CHAIN: 0,
            RETRIEVER: 0,
            DECISION: 0,
            RESULT: 0,
            ERROR: 0,
            LOGIC: children.filter((c) => c.event.kind === "LOGIC").length,
            LOG: 0,
            OUTCOME: 0,
          },
        },
      },
    ],
    events: events as TraceReadResult["events"],
    warnings: [],
    unsupportedFields: [],
    sourceFiles: [],
  };
}

const contract = defineTraceContract({
  run: { requireCompleted: true },
  observations: {
    required: ["policyShown"],
    failOn: ["failed", "unknown", "skipped"],
  },
  retry: {
    operations: [
      {
        tool: "retrieve_policy",
        sideEffectClass: "read",
        maxAttempts: 2,
        retryableErrors: { codes: ["TemporaryUnavailable"] },
        requireFailureBeforeRetry: true,
        requireSameArguments: "structured-or-digest",
        requireTerminalSuccess: true,
        requireRecoveredFailureVisible: true,
        successfulResultDependency: {
          consumerKind: "LLM",
          requireExplicitReference: true,
        },
      },
    ],
  },
});

const ARGS = { tenant: "t1", policy: "p1", version: "v1" };
const BUDGET_MS = 100;

function toolAttempt(
  id: string,
  startMs: number,
  endMs: number,
  attrs: Record<string, unknown>,
  status: "ok" | "error" = "ok",
) {
  return event(id, {
    kind: "TOOL",
    name: "tool:retrieve_policy",
    status,
    attributes: {
      toolName: "retrieve_policy",
      noSideEffect: true,
      operationId: "op1",
      arguments: ARGS,
      ...attrs,
    },
    startedAt: atMs(startMs),
    endedAt: atMs(endMs),
    timestamp: atMs(startMs),
  });
}

function answer(startMs: number, referenced: string) {
  return event("llm", {
    kind: "LLM",
    name: "llm:answer",
    attributes: { referencedEventIds: [referenced] },
    startedAt: atMs(startMs),
    endedAt: atMs(startMs + 1),
    timestamp: atMs(startMs),
  });
}

function outcome(status: "passed" | "failed" = "passed") {
  return event("policyShown", {
    kind: "OUTCOME",
    name: "policyShown",
    status: status === "passed" ? "ok" : "error",
    attributes: {
      outcomeStatus: status,
      expectation: "policyShown",
      observedAt: atMs(50),
    },
    timestamp: atMs(50),
  });
}

function runRoot() {
  return event("run", { kind: "RUN", name: "run-recovery" });
}

/** Recipe-level budget: last event end within BUDGET_MS of run start. */
function withinBudget(events: ReturnType<typeof event>[]): boolean {
  let maxEnd = 0;
  for (const e of events) {
    const end = typeof e.endedAt === "string" ? Date.parse(e.endedAt) : Date.parse(e.timestamp);
    if (Number.isFinite(end)) maxEnd = Math.max(maxEnd, end);
  }
  const start = Date.parse("2026-09-12T10:00:00.000Z");
  return maxEnd - start <= BUDGET_MS;
}

type Case = {
  name: string;
  events: ReturnType<typeof event>[];
  expected: "pass" | "fail";
  /** Optional recipe-level budget assertion (disclosed; not a core contract field). */
  requireWithinBudget?: boolean;
};

const cases: Case[] = [
  {
    name: "valid-single-read",
    expected: "pass",
    requireWithinBudget: true,
    events: [
      runRoot(),
      toolAttempt("a1", 0, 10, { attemptId: "a1", attemptNumber: 1 }),
      answer(31, "a1"),
      outcome("passed"),
    ],
  },
  {
    name: "valid-recovery",
    expected: "pass",
    requireWithinBudget: true,
    events: [
      runRoot(),
      toolAttempt(
        "a1",
        0,
        10,
        {
          attemptId: "a1",
          attemptNumber: 1,
          errorCode: "TemporaryUnavailable",
        },
        "error",
      ),
      toolAttempt("a2", 20, 30, {
        attemptId: "a2",
        attemptNumber: 2,
        retryOf: "a1",
      }),
      answer(31, "a2"),
      outcome("passed"),
    ],
  },
  {
    name: "two-successes-no-permitted-cause",
    expected: "fail",
    events: [
      runRoot(),
      toolAttempt("a1", 0, 10, { attemptId: "a1", attemptNumber: 1 }),
      toolAttempt("a2", 20, 30, {
        attemptId: "a2",
        attemptNumber: 2,
        retryOf: "a1",
      }),
      answer(31, "a2"),
      outcome("passed"),
    ],
  },
  {
    name: "nonretryable-error",
    expected: "fail",
    events: [
      runRoot(),
      toolAttempt(
        "a1",
        0,
        10,
        { attemptId: "a1", attemptNumber: 1, errorCode: "PermanentDenied" },
        "error",
      ),
      toolAttempt("a2", 20, 30, {
        attemptId: "a2",
        attemptNumber: 2,
        retryOf: "a1",
      }),
      answer(31, "a2"),
      outcome("passed"),
    ],
  },
  {
    name: "changed-arguments",
    expected: "fail",
    events: [
      runRoot(),
      toolAttempt(
        "a1",
        0,
        10,
        {
          attemptId: "a1",
          attemptNumber: 1,
          errorCode: "TemporaryUnavailable",
          arguments: { tenant: "t1", policy: "p1", version: "v1" },
        },
        "error",
      ),
      toolAttempt("a2", 20, 30, {
        attemptId: "a2",
        attemptNumber: 2,
        retryOf: "a1",
        arguments: { tenant: "t2", policy: "p1", version: "v1" },
      }),
      answer(31, "a2"),
      outcome("passed"),
    ],
  },
  {
    name: "too-many-attempts",
    expected: "fail",
    events: [
      runRoot(),
      toolAttempt(
        "a1",
        0,
        5,
        {
          attemptId: "a1",
          attemptNumber: 1,
          errorCode: "TemporaryUnavailable",
        },
        "error",
      ),
      toolAttempt(
        "a2",
        10,
        15,
        {
          attemptId: "a2",
          attemptNumber: 2,
          retryOf: "a1",
          errorCode: "TemporaryUnavailable",
        },
        "error",
      ),
      toolAttempt("a3", 20, 30, {
        attemptId: "a3",
        attemptNumber: 3,
        retryOf: "a2",
      }),
      answer(31, "a3"),
      outcome("passed"),
    ],
  },
  {
    name: "future-overlapping-answer",
    expected: "fail",
    events: [
      runRoot(),
      toolAttempt("a1", 0, 40, { attemptId: "a1", attemptNumber: 1 }),
      answer(20, "a1"),
      outcome("passed"),
    ],
  },
  {
    name: "both-fail-answer-claims-success",
    expected: "fail",
    events: [
      runRoot(),
      toolAttempt(
        "a1",
        0,
        10,
        {
          attemptId: "a1",
          attemptNumber: 1,
          errorCode: "TemporaryUnavailable",
        },
        "error",
      ),
      toolAttempt(
        "a2",
        20,
        30,
        {
          attemptId: "a2",
          attemptNumber: 2,
          retryOf: "a1",
          errorCode: "TemporaryUnavailable",
        },
        "error",
      ),
      answer(31, "a2"),
      outcome("passed"),
    ],
  },
  {
    name: "missing-result-link",
    expected: "fail",
    events: [
      runRoot(),
      toolAttempt(
        "a1",
        0,
        10,
        {
          attemptId: "a1",
          attemptNumber: 1,
          errorCode: "TemporaryUnavailable",
        },
        "error",
      ),
      toolAttempt("a2", 20, 30, {
        attemptId: "a2",
        attemptNumber: 2,
        retryOf: "a1",
      }),
      answer(31, "missing"),
      outcome("passed"),
    ],
  },
  {
    name: "failed-safety-observation",
    expected: "fail",
    events: [
      runRoot(),
      toolAttempt("a1", 0, 10, { attemptId: "a1", attemptNumber: 1 }),
      answer(31, "a1"),
      outcome("failed"),
    ],
  },
];

let mismatches = 0;
for (const c of cases) {
  const evaluated = evaluateTraceContract({ read: read(c.events) }, contract);
  let status = evaluated.status;
  if (c.requireWithinBudget === true && !withinBudget(c.events)) {
    status = "fail";
  }
  const match = status === c.expected;
  if (!match) mismatches += 1;
  console.log(
    `${c.name} expected=${c.expected} observed=${status} ${match ? "OK" : "MISMATCH"}`,
  );
}

if (mismatches > 0) {
  console.error(`bounded-read-recovery matrix: ${mismatches} classification mismatch(es)`);
  process.exitCode = 1;
} else {
  console.log(`bounded-read-recovery matrix: ${cases.length}/${cases.length} classifications match`);
}
