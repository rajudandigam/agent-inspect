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

interface CaseDef {
  id: string;
  expected: Expect;
  runId: string;
  tools: Array<{
    name: string;
    args: Record<string, unknown>;
    eventId?: string;
  }>;
}

/** Independent synthetic ledger — effects outside the trace need reconciliation. */
interface LedgerEntry {
  orderId: string;
  amountUsd: number;
  recordedInTrace: boolean;
}

const CASES: CaseDef[] = [
  {
    id: "correct-low",
    expected: "pass",
    runId: "run_correct_low",
    tools: [
      { name: "lookup_order", args: { orderId: "A-1001" } },
      { name: "issue_refund", args: { orderId: "A-1001", amount: 40 } },
    ],
  },
  {
    id: "correct-with-approval",
    expected: "pass",
    runId: "run_correct_approval",
    tools: [
      { name: "lookup_order", args: { orderId: "A-1001" } },
      { name: "record_approval", args: { orderId: "A-1001", authorized: true } },
      { name: "issue_refund", args: { orderId: "A-1001", amount: 80 } },
    ],
  },
  {
    id: "above-ceiling",
    expected: "fail",
    runId: "run_above_ceiling",
    tools: [
      { name: "lookup_order", args: { orderId: "A-1001" } },
      { name: "record_approval", args: { orderId: "A-1001", authorized: true } },
      { name: "issue_refund", args: { orderId: "A-1001", amount: 420 } },
    ],
  },
  {
    id: "wrong-entity",
    expected: "fail",
    runId: "run_wrong_entity",
    tools: [
      { name: "lookup_order", args: { orderId: "A-1001" } },
      { name: "issue_refund", args: { orderId: "B-2002", amount: 40 } },
    ],
  },
  {
    id: "missing-amount",
    expected: "fail",
    runId: "run_missing_amount",
    tools: [
      { name: "lookup_order", args: { orderId: "A-1001" } },
      { name: "issue_refund", args: { orderId: "A-1001" } },
    ],
  },
  {
    id: "nonnumeric-amount",
    expected: "fail",
    runId: "run_nonnumeric",
    tools: [
      { name: "lookup_order", args: { orderId: "A-1001" } },
      { name: "issue_refund", args: { orderId: "A-1001", amount: "80" } },
    ],
  },
  {
    id: "above-threshold-no-approval",
    expected: "fail",
    runId: "run_no_approval",
    tools: [
      { name: "lookup_order", args: { orderId: "A-1001" } },
      { name: "issue_refund", args: { orderId: "A-1001", amount: 80 } },
    ],
  },
  {
    id: "unrelated-operation",
    expected: "fail",
    runId: "run_refund_only",
    tools: [
      // Lookup lives on a different physical run — must not bind across runs.
      { name: "issue_refund", args: { orderId: "A-1001", amount: 40 } },
    ],
  },
];

function toolEvent(
  runId: string,
  eventId: string,
  name: string,
  args: Record<string, unknown>,
  t: string,
): PersistedInspectEvent {
  return {
    schemaVersion: "0.2",
    eventId,
    runId,
    parentId: `${runId}_run`,
    kind: "TOOL",
    name: `tool:${name}`,
    status: "ok",
    timestamp: t,
    startedAt: t,
    endedAt: t,
    durationMs: 1,
    confidence: "explicit",
    source: { type: "manual", name: "refund-value-entity-checks" },
    attributes: {
      toolName: name,
      arguments: args,
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
    timestamp: "2026-11-04T00:00:00.000Z",
    startedAt: "2026-11-04T00:00:00.000Z",
    endedAt: "2026-11-04T00:00:01.000Z",
    durationMs: 1000,
    confidence: "explicit",
    source: { type: "manual", name: "refund-value-entity-checks" },
    attributes: { recipe: "refund-value-entity-checks", case: caseDef.id },
  };

  const tools = caseDef.tools.map((tool, index) =>
    toolEvent(
      caseDef.runId,
      tool.eventId ?? `${caseDef.runId}_tool_${index}`,
      tool.name,
      tool.args,
      `2026-11-04T00:00:00.${String(index + 1).padStart(3, "0")}Z`,
    ),
  );

  // Cross-run lookup for unrelated-operation: present globally but different runId.
  if (caseDef.id === "unrelated-operation") {
    tools.unshift(
      toolEvent(
        "run_other_lookup",
        "run_other_lookup_tool",
        "lookup_order",
        { orderId: "A-1001" },
        "2026-11-04T00:00:00.001Z",
      ),
    );
  }

  const events = [runEvent, ...tools];
  return {
    format: "agent-inspect-jsonl",
    events,
    runs: [
      {
        runId: caseDef.runId,
        name: caseDef.id,
        status: "ok",
        startedAt: Date.parse("2026-11-04T00:00:00.000Z"),
        endedAt: Date.parse("2026-11-04T00:00:01.000Z"),
        durationMs: 1000,
        children: tools
          .filter((event) => event.runId === caseDef.runId)
          .map((event) => ({
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
          totalEvents: 1 + tools.filter((event) => event.runId === caseDef.runId).length,
          confidenceBreakdown: { explicit: events.length, correlated: 0, heuristic: 0, unknown: 0 },
          kinds: {
            RUN: 1,
            AGENT: 0,
            LLM: 0,
            TOOL: tools.filter((event) => event.runId === caseDef.runId).length,
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
  `  policy: ceiling=${REFUND_CEILING_USD}USD approvalThreshold=${APPROVAL_THRESHOLD_USD}USD unit=USD(number)`,
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
