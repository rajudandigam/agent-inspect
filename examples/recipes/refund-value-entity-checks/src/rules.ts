/**
 * Recipe-local TraceCheckRules — public extension API only.
 * Not registered in CLI check --config.
 */
import {
  extractToolArgumentPayload,
  resolveJsonPointer,
  type TraceCheckContext,
  type TraceCheckEvidence,
  type TraceCheckFinding,
  type TraceCheckRule,
} from "agent-inspect/checks";
import type { PersistedInspectEvent } from "agent-inspect/readers";

/** Ceiling in USD (finite number; no string coercion). */
export const REFUND_CEILING_USD = 100;
/** Amounts above this USD value require authorized approval evidence. */
export const APPROVAL_THRESHOLD_USD = 50;

function toolName(event: PersistedInspectEvent): string {
  const attrs = event.attributes ?? {};
  const fromAttr = attrs.toolName;
  if (typeof fromAttr === "string" && fromAttr.length > 0) return fromAttr;
  const name = event.name;
  return name.startsWith("tool:") ? name.slice("tool:".length) : name;
}

function finishedTools(
  context: TraceCheckContext,
  name: string,
): PersistedInspectEvent[] {
  const events = context.logicalEvents ?? context.events;
  return events.filter(
    (event) =>
      event.kind === "TOOL" &&
      event.status !== "running" &&
      toolName(event) === name,
  );
}

function argAt(
  event: PersistedInspectEvent,
  pointer: string,
): { present: boolean; value: unknown } {
  const payload = extractToolArgumentPayload(event);
  if (!payload.present) return { present: false, value: undefined };
  const resolved = resolveJsonPointer(payload.value, pointer);
  if (!resolved.found) return { present: false, value: undefined };
  return { present: true, value: resolved.value };
}

function evidenceFor(event: PersistedInspectEvent, path?: string): TraceCheckEvidence {
  return {
    runId: event.runId,
    eventId: event.eventId,
    kind: event.kind,
    name: event.name,
    ...(path !== undefined ? { path } : {}),
  };
}

function fail(
  ruleId: string,
  message: string,
  evidence: readonly TraceCheckEvidence[],
  expected?: unknown,
  actual?: unknown,
): TraceCheckFinding {
  return {
    ruleId,
    severity: "error",
    status: "fail",
    message,
    evidence: [...evidence],
    ...(expected !== undefined ? { expected } : {}),
    ...(actual !== undefined ? { actual } : {}),
  };
}

/** Reject non-finite / non-number amounts — never coerce strings. */
function readUsdAmount(
  event: PersistedInspectEvent,
): { ok: true; amount: number } | { ok: false; reason: string; actual: unknown } {
  const got = argAt(event, "/amount");
  if (!got.present) {
    return { ok: false, reason: "missing amount evidence", actual: undefined };
  }
  if (typeof got.value !== "number" || !Number.isFinite(got.value)) {
    return {
      ok: false,
      reason: "amount must be a finite USD number (no string coercion)",
      actual: got.value,
    };
  }
  return { ok: true, amount: got.value };
}

/**
 * Refund amount ≤ ceiling (USD number).
 */
export function createRefundAmountCeilingRule(): TraceCheckRule {
  return {
    id: "recipe.refund.amount-ceiling",
    category: "tool",
    defaultSeverity: "error",
    evaluate(context) {
      const findings: TraceCheckFinding[] = [];
      for (const event of finishedTools(context, "issue_refund")) {
        const amount = readUsdAmount(event);
        if (!amount.ok) {
          findings.push(
            fail(
              "recipe.refund.amount-ceiling",
              `issue_refund amount unavailable: ${amount.reason}.`,
              [evidenceFor(event, "arguments.amount")],
              { unit: "USD", ceiling: REFUND_CEILING_USD },
              amount.actual,
            ),
          );
          continue;
        }
        if (amount.amount > REFUND_CEILING_USD) {
          findings.push(
            fail(
              "recipe.refund.amount-ceiling",
              `issue_refund amount ${amount.amount} USD exceeds ceiling ${REFUND_CEILING_USD} USD.`,
              [evidenceFor(event, "arguments.amount")],
              { unit: "USD", ceiling: REFUND_CEILING_USD },
              amount.amount,
            ),
          );
        }
      }
      return findings;
    },
  };
}

/**
 * Bind refund orderId to the first lookup_order in the same physical run.
 * Does not grab a global "last lookup" across runs.
 */
export function createRefundEntityBindRule(): TraceCheckRule {
  return {
    id: "recipe.refund.entity-bind",
    category: "tool",
    defaultSeverity: "error",
    evaluate(context) {
      const findings: TraceCheckFinding[] = [];
      const refunds = finishedTools(context, "issue_refund");
      for (const refund of refunds) {
        const order = argAt(refund, "/orderId");
        if (!order.present || typeof order.value !== "string" || order.value.length === 0) {
          findings.push(
            fail(
              "recipe.refund.entity-bind",
              "issue_refund orderId evidence missing or not a string.",
              [evidenceFor(refund, "arguments.orderId")],
              "string orderId",
              order.value,
            ),
          );
          continue;
        }
        const lookups = finishedTools(context, "lookup_order").filter(
          (event) => event.runId === refund.runId,
        );
        if (lookups.length === 0) {
          findings.push(
            fail(
              "recipe.refund.entity-bind",
              `No finished lookup_order in run ${refund.runId} to bind refund orderId.`,
              [evidenceFor(refund, "arguments.orderId")],
              { runId: refund.runId, orderId: order.value },
              { lookupCount: 0 },
            ),
          );
          continue;
        }
        const firstLookup = lookups[0]!;
        const lookupOrder = argAt(firstLookup, "/orderId");
        if (
          !lookupOrder.present ||
          typeof lookupOrder.value !== "string" ||
          lookupOrder.value.length === 0
        ) {
          findings.push(
            fail(
              "recipe.refund.entity-bind",
              "lookup_order orderId evidence missing or not a string.",
              [evidenceFor(firstLookup, "arguments.orderId"), evidenceFor(refund)],
              "string orderId",
              lookupOrder.value,
            ),
          );
          continue;
        }
        if (lookupOrder.value !== order.value) {
          findings.push(
            fail(
              "recipe.refund.entity-bind",
              `Refund orderId ${order.value} does not match first lookup_order ${lookupOrder.value} in run ${refund.runId}.`,
              [
                evidenceFor(firstLookup, "arguments.orderId"),
                evidenceFor(refund, "arguments.orderId"),
              ],
              lookupOrder.value,
              order.value,
            ),
          );
        }
      }
      return findings;
    },
  };
}

/**
 * Amounts above APPROVAL_THRESHOLD_USD require authorized approval for the same order.
 * Below-threshold refunds may omit approval. An unconstrained "no approval" branch
 * does not satisfy above-threshold cases.
 */
export function createRefundApprovalGateRule(): TraceCheckRule {
  return {
    id: "recipe.refund.approval-gate",
    category: "control",
    defaultSeverity: "error",
    evaluate(context) {
      const findings: TraceCheckFinding[] = [];
      for (const refund of finishedTools(context, "issue_refund")) {
        const amount = readUsdAmount(refund);
        if (!amount.ok) {
          // Ceiling rule already reports evidence problems; skip duplicate here.
          continue;
        }
        if (amount.amount <= APPROVAL_THRESHOLD_USD) continue;

        const order = argAt(refund, "/orderId");
        const orderId =
          order.present && typeof order.value === "string" ? order.value : undefined;
        if (!orderId) {
          findings.push(
            fail(
              "recipe.refund.approval-gate",
              `Refund ${amount.amount} USD exceeds approval threshold ${APPROVAL_THRESHOLD_USD} USD but orderId is unavailable.`,
              [evidenceFor(refund)],
              { unit: "USD", threshold: APPROVAL_THRESHOLD_USD },
              amount.amount,
            ),
          );
          continue;
        }

        const approvals = finishedTools(context, "record_approval").filter((event) => {
          if (event.runId !== refund.runId) return false;
          const approvedOrder = argAt(event, "/orderId");
          const authorized = argAt(event, "/authorized");
          return (
            approvedOrder.present &&
            approvedOrder.value === orderId &&
            authorized.present &&
            authorized.value === true
          );
        });

        if (approvals.length === 0) {
          findings.push(
            fail(
              "recipe.refund.approval-gate",
              `Refund ${amount.amount} USD for ${orderId} exceeds threshold ${APPROVAL_THRESHOLD_USD} USD without authorized record_approval in the same run.`,
              [evidenceFor(refund, "arguments.amount")],
              { unit: "USD", threshold: APPROVAL_THRESHOLD_USD, orderId, authorized: true },
              { approvalCount: 0 },
            ),
          );
        }
      }
      return findings;
    },
  };
}

export function recipeRefundRules(): TraceCheckRule[] {
  return [
    createRefundAmountCeilingRule(),
    createRefundEntityBindRule(),
    createRefundApprovalGateRule(),
  ];
}
