/**
 * Frank/Firat refund value + entity checks via public TraceCheckRule extension.
 * Discussion #527 illustrative lte/from syntax is NOT a shipped contract API.
 */
import {
  runTraceChecks,
  type TraceCheckRule,
} from "agent-inspect/checks";
import type { PersistedInspectEvent, TraceReadResult } from "agent-inspect/readers";

import {
  APPROVAL_THRESHOLD_USD,
  REFUND_CEILING_USD,
  recipeRefundRules,
} from "./rules.js";

type Expect = "pass" | "fail";

interface ToolSpec {
  name: string;
  args: Record<string, unknown>;
  eventId?: string;
  status?: "ok" | "error" | "running";
  startedAt?: string;
  endedAt?: string;
  runId?: string;
}

interface CaseDef {
  id: string;
  expected: Expect;
  runId: string;
  tools: ToolSpec[];
}

/** Independent synthetic ledger — effects outside the trace need reconciliation. */
interface LedgerEntry {
  orderId: string;
  amountUsd: number;
  recordedInTrace: boolean;
}

const T0 = "2026-11-04T00:00:00.000Z";
const T1 = "2026-11-04T00:00:01.000Z";
const T2 = "2026-11-04T00:00:02.000Z";
const T3 = "2026-11-04T00:00:03.000Z";
const T4 = "2026-11-04T00:00:04.000Z";
const T5 = "2026-11-04T00:00:05.000Z";

const CASES: CaseDef[] = [
  {
    id: "correct-low",
    expected: "pass",
    runId: "run_correct_low",
    tools: [
      { name: "lookup_order", args: { orderId: "A-1001" }, startedAt: T1, endedAt: T1 },
      {
        name: "issue_refund",
        args: { orderId: "A-1001", amount: 40 },
        startedAt: T2,
        endedAt: T2,
      },
    ],
  },
  {
    id: "correct-with-approval",
    expected: "pass",
    runId: "run_correct_approval",
    tools: [
      { name: "lookup_order", args: { orderId: "A-1001" }, startedAt: T1, endedAt: T1 },
      {
        name: "record_approval",
        args: { orderId: "A-1001", authorized: true },
        startedAt: T2,
        endedAt: T2,
      },
      {
        name: "issue_refund",
        args: { orderId: "A-1001", amount: 80 },
        startedAt: T3,
        endedAt: T3,
      },
    ],
  },
  {
    id: "duplicate-lookup-same-order",
    expected: "pass",
    runId: "run_dup_lookup",
    tools: [
      { name: "lookup_order", args: { orderId: "A-1001" }, startedAt: T1, endedAt: T1 },
      { name: "lookup_order", args: { orderId: "A-1001" }, startedAt: T2, endedAt: T2 },
      {
        name: "issue_refund",
        args: { orderId: "A-1001", amount: 40 },
        startedAt: T3,
        endedAt: T3,
      },
    ],
  },
  {
    id: "lookup-b-then-a",
    expected: "pass",
    runId: "run_lookup_b_then_a",
    tools: [
      // Unrelated lookup B must not steal the bind from valid lookup A.
      { name: "lookup_order", args: { orderId: "B-2002" }, startedAt: T1, endedAt: T1 },
      { name: "lookup_order", args: { orderId: "A-1001" }, startedAt: T2, endedAt: T2 },
      {
        name: "issue_refund",
        args: { orderId: "A-1001", amount: 40 },
        startedAt: T3,
        endedAt: T3,
      },
    ],
  },
  {
    id: "above-ceiling",
    expected: "fail",
    runId: "run_above_ceiling",
    tools: [
      { name: "lookup_order", args: { orderId: "A-1001" }, startedAt: T1, endedAt: T1 },
      {
        name: "record_approval",
        args: { orderId: "A-1001", authorized: true },
        startedAt: T2,
        endedAt: T2,
      },
      {
        name: "issue_refund",
        args: { orderId: "A-1001", amount: 420 },
        startedAt: T3,
        endedAt: T3,
      },
    ],
  },
  {
    id: "unfinished-above-ceiling",
    expected: "fail",
    runId: "run_unfinished_ceiling",
    tools: [
      { name: "lookup_order", args: { orderId: "A-1001" }, startedAt: T1, endedAt: T1 },
      {
        name: "issue_refund",
        args: { orderId: "A-1001", amount: 420 },
        status: "running",
        startedAt: T2,
      },
    ],
  },
  {
    id: "wrong-entity",
    expected: "fail",
    runId: "run_wrong_entity",
    tools: [
      { name: "lookup_order", args: { orderId: "A-1001" }, startedAt: T1, endedAt: T1 },
      {
        name: "issue_refund",
        args: { orderId: "B-2002", amount: 40 },
        startedAt: T2,
        endedAt: T2,
      },
    ],
  },
  {
    id: "ambiguous-lookup-ops",
    expected: "fail",
    runId: "run_ambiguous_ops",
    tools: [
      {
        name: "lookup_order",
        args: { orderId: "A-1001", operationId: "op-1" },
        startedAt: T1,
        endedAt: T1,
      },
      {
        name: "lookup_order",
        args: { orderId: "A-1001", operationId: "op-2" },
        startedAt: T2,
        endedAt: T2,
      },
      {
        name: "issue_refund",
        args: { orderId: "A-1001", amount: 40 },
        startedAt: T3,
        endedAt: T3,
      },
    ],
  },
  {
    id: "missing-amount",
    expected: "fail",
    runId: "run_missing_amount",
    tools: [
      { name: "lookup_order", args: { orderId: "A-1001" }, startedAt: T1, endedAt: T1 },
      { name: "issue_refund", args: { orderId: "A-1001" }, startedAt: T2, endedAt: T2 },
    ],
  },
  {
    id: "nonnumeric-amount",
    expected: "fail",
    runId: "run_nonnumeric",
    tools: [
      { name: "lookup_order", args: { orderId: "A-1001" }, startedAt: T1, endedAt: T1 },
      {
        name: "issue_refund",
        args: { orderId: "A-1001", amount: "80" },
        startedAt: T2,
        endedAt: T2,
      },
    ],
  },
  {
    id: "above-threshold-no-approval",
    expected: "fail",
    runId: "run_no_approval",
    tools: [
      { name: "lookup_order", args: { orderId: "A-1001" }, startedAt: T1, endedAt: T1 },
      {
        name: "issue_refund",
        args: { orderId: "A-1001", amount: 80 },
        startedAt: T2,
        endedAt: T2,
      },
    ],
  },
  {
    id: "late-approval",
    expected: "fail",
    runId: "run_late_approval",
    tools: [
      { name: "lookup_order", args: { orderId: "A-1001" }, startedAt: T1, endedAt: T1 },
      {
        name: "issue_refund",
        args: { orderId: "A-1001", amount: 80 },
        startedAt: T2,
        endedAt: T3,
      },
      {
        name: "record_approval",
        args: { orderId: "A-1001", authorized: true },
        startedAt: T4,
        endedAt: T5,
      },
    ],
  },
  {
    id: "overlapping-approval",
    expected: "fail",
    runId: "run_overlap_approval",
    tools: [
      { name: "lookup_order", args: { orderId: "A-1001" }, startedAt: T1, endedAt: T1 },
      {
        name: "record_approval",
        args: { orderId: "A-1001", authorized: true },
        startedAt: T2,
        endedAt: T4,
      },
      {
        name: "issue_refund",
        args: { orderId: "A-1001", amount: 80 },
        startedAt: T3,
        endedAt: T5,
      },
    ],
  },
  {
    id: "failed-approval",
    expected: "fail",
    runId: "run_failed_approval",
    tools: [
      { name: "lookup_order", args: { orderId: "A-1001" }, startedAt: T1, endedAt: T1 },
      {
        name: "record_approval",
        args: { orderId: "A-1001", authorized: true },
        status: "error",
        startedAt: T2,
        endedAt: T2,
      },
      {
        name: "issue_refund",
        args: { orderId: "A-1001", amount: 80 },
        startedAt: T3,
        endedAt: T3,
      },
    ],
  },
  {
    id: "foreign-operation-approval",
    expected: "fail",
    runId: "run_foreign_op_approval",
    tools: [
      {
        name: "lookup_order",
        args: { orderId: "A-1001", operationId: "op-refund" },
        startedAt: T1,
        endedAt: T1,
      },
      {
        name: "record_approval",
        args: { orderId: "A-1001", operationId: "op-other", authorized: true },
        startedAt: T2,
        endedAt: T2,
      },
      {
        name: "issue_refund",
        args: { orderId: "A-1001", operationId: "op-refund", amount: 80 },
        startedAt: T3,
        endedAt: T3,
      },
    ],
  },
  {
    id: "unrelated-operation",
    expected: "fail",
    runId: "run_refund_only",
    tools: [
      // Lookup lives on a different physical run — must not bind across runs.
      { name: "issue_refund", args: { orderId: "A-1001", amount: 40 }, startedAt: T2, endedAt: T2 },
    ],
  },
];

function toolEvent(caseDef: CaseDef, tool: ToolSpec, index: number): PersistedInspectEvent {
  const runId = tool.runId ?? caseDef.runId;
  const startedAt = tool.startedAt ?? `2026-11-04T00:00:00.${String(index + 1).padStart(3, "0")}Z`;
  const status = tool.status ?? "ok";
  const endedAt =
    status === "running" ? undefined : (tool.endedAt ?? startedAt);
  return {
    schemaVersion: "0.2",
    eventId: tool.eventId ?? `${runId}_tool_${index}`,
    runId,
    parentId: `${caseDef.runId}_run`,
    kind: "TOOL",
    name: `tool:${tool.name}`,
    status,
    timestamp: startedAt,
    startedAt,
    ...(endedAt !== undefined ? { endedAt, durationMs: Math.max(0, Date.parse(endedAt) - Date.parse(startedAt)) } : {}),
    confidence: "explicit",
    source: { type: "manual", name: "refund-value-entity-checks" },
    attributes: {
      toolName: tool.name,
      arguments: tool.args,
    },
  };
}

function buildRead(caseDef: CaseDef): TraceReadResult {
  const runEvent: PersistedInspectEvent = {
    schemaVersion: "0.2",
    eventId: `${caseDef.runId}_run`,
    runId: caseDef.runId,
    kind: "RUN",
    name: caseDef.id,
    status: "ok",
    timestamp: T0,
    startedAt: T0,
    endedAt: T5,
    durationMs: 5000,
    confidence: "explicit",
    source: { type: "manual", name: "refund-value-entity-checks" },
    attributes: { recipe: "refund-value-entity-checks", case: caseDef.id },
  };

  const tools = caseDef.tools.map((tool, index) => toolEvent(caseDef, tool, index));

  // Cross-run lookup for unrelated-operation: present globally but different runId.
  if (caseDef.id === "unrelated-operation") {
    tools.unshift(
      toolEvent(
        caseDef,
        {
          name: "lookup_order",
          args: { orderId: "A-1001" },
          runId: "run_other_lookup",
          eventId: "run_other_lookup_tool",
          startedAt: T1,
          endedAt: T1,
        },
        0,
      ),
    );
  }

  const events = [runEvent, ...tools];
  const runTools = tools.filter((event) => event.runId === caseDef.runId);
  return {
    format: "agent-inspect-jsonl",
    events,
    runs: [
      {
        runId: caseDef.runId,
        name: caseDef.id,
        status: "ok",
        startedAt: Date.parse(T0),
        endedAt: Date.parse(T5),
        durationMs: 5000,
        children: runTools.map((event) => ({
          event: {
            eventId: event.eventId,
            runId: event.runId,
            parentId: event.parentId,
            name: event.name,
            kind: event.kind,
            timestamp: Date.parse(event.timestamp),
            status: event.status,
            durationMs: event.durationMs,
            attributes: event.attributes,
            confidence: event.confidence,
            source: { type: "manual" as const },
          },
          children: [],
          depth: 1,
        })),
        metadata: {
          totalEvents: 1 + runTools.length,
          confidenceBreakdown: { explicit: events.length, correlated: 0, heuristic: 0, unknown: 0 },
          kinds: {
            RUN: 1,
            AGENT: 0,
            LLM: 0,
            TOOL: runTools.length,
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
      },
    ],
    warnings: [],
    unsupportedFields: [],
    sourceFiles: [`inline:${caseDef.id}`],
  };
}

function evaluateCase(
  caseDef: CaseDef,
  rules: readonly TraceCheckRule[],
): { id: string; expected: Expect; observed: string; codes: string[] } {
  const result = runTraceChecks(
    { read: buildRead(caseDef), sourceLabel: caseDef.id },
    { rules: [...rules], runId: caseDef.runId },
  );
  const codes = [
    ...new Set(
      result.findings
        .filter((finding) => finding.status === "fail")
        .map((finding) => finding.ruleId),
    ),
  ].sort();
  return {
    id: caseDef.id,
    expected: caseDef.expected,
    observed: result.status,
    codes,
  };
}

const rules = recipeRefundRules();
const results = CASES.map((caseDef) => evaluateCase(caseDef, rules));

console.log("refund-value-entity-checks:");
console.log(
  "  note: recipe-local TraceCheckRule via runTraceChecks; native operators remain exists|type|equals|oneOf",
);
console.log(
  `  policy: ceiling=${REFUND_CEILING_USD}USD approvalThreshold=${APPROVAL_THRESHOLD_USD}USD unit=USD(number) join=orderId(+operationId) approvalBeforeAction=true`,
);
console.log("  credit: discussion #527 value/entity examples (Frank); Firat stress cases inspired reproductions");

for (const row of results) {
  const codePart = row.codes.length > 0 ? ` rules=${row.codes.join(",")}` : "";
  console.log(`  ${row.id}: expected=${row.expected} observed=${row.observed}${codePart}`);
  if (row.expected !== row.observed) {
    throw new Error(`${row.id}: expected ${row.expected} but observed ${row.observed}`);
  }
}

console.log(
  `classes: ${results.map((row) => `${row.id}:${row.observed}`).join(",")}`,
);

// Independent ledger: an effect recorded outside the trace cannot be proven from events alone.
const ledger: LedgerEntry[] = [
  { orderId: "A-1001", amountUsd: 40, recordedInTrace: true },
  { orderId: "Z-9999", amountUsd: 25, recordedInTrace: false },
];
const uninstrumented = ledger.filter((entry) => !entry.recordedInTrace);
console.log("ledger-reconciliation:");
console.log(
  `  covered=${ledger.length - uninstrumented.length} uninstrumented=${uninstrumented.length} status=${uninstrumented.length === 0 ? "ok" : "needs-reconcile"}`,
);
console.log(
  "  note: uninstrumented ledger rows are outside declared trace coverage; forbidden-tools cannot observe unrecorded SDK calls",
);
