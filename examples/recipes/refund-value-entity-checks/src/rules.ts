/**
 * Recipe-local TraceCheckRules — public extension API only.
 * Not registered in CLI check --config.
 *
 * N3 / Frank policy (recipe-local, not universal TraceContract operators):
 * - Bind refund → lookup by orderId (and operationId when declared); refuse
 *   ambiguous conflicting candidates; never use global first-lookup.
 * - Above-threshold refunds need a successful approval completed before the
 *   refund starts (same order / operation identity when declared).
 * - Ceiling inspects finished and attempted (running) refund amounts.
 * - Exact tool-name matching. Duplicate same-orderId retrieval is allowed.
 * - Per-call vs cumulative ceilings and negative-amount domains stay recipe
 *   policy; this file does not invent universal rules for those.
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

/** Ceiling in USD (finite number; no string coercion). Per-call, not cumulative. */
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

function toolsNamed(
  context: TraceCheckContext,
  name: string,
  options?: { includeRunning?: boolean },
): PersistedInspectEvent[] {
  const events = context.logicalEvents ?? context.events;
  return events.filter((event) => {
    if (event.kind !== "TOOL") return false;
    if (toolName(event) !== name) return false;
    if (options?.includeRunning) return true;
    return event.status !== "running";
  });
}

function finishedTools(
  context: TraceCheckContext,
  name: string,
): PersistedInspectEvent[] {
  return toolsNamed(context, name, { includeRunning: false });
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

function stringArg(
  event: PersistedInspectEvent,
  pointer: string,
): string | undefined {
  const got = argAt(event, pointer);
  if (!got.present || typeof got.value !== "string" || got.value.length === 0) {
    return undefined;
  }
  return got.value;
}

function eventStartMs(event: PersistedInspectEvent): number | undefined {
  const raw = event.startedAt ?? event.timestamp;
  if (typeof raw !== "string" || raw.length === 0) return undefined;
  const ms = Date.parse(raw);
  return Number.isFinite(ms) ? ms : undefined;
}

function eventEndMs(event: PersistedInspectEvent): number | undefined {
  if (typeof event.endedAt !== "string" || event.endedAt.length === 0) return undefined;
  const ms = Date.parse(event.endedAt);
  return Number.isFinite(ms) ? ms : undefined;
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
 * Select lookup candidates for a refund by orderId (+ operationId when declared).
 * Returns ambiguous when multiple conflicting identities match.
 */
function selectLookupForRefund(
  refund: PersistedInspectEvent,
  lookups: readonly PersistedInspectEvent[],
):
  | { status: "ok"; lookup: PersistedInspectEvent }
  | { status: "missing" }
  | { status: "ambiguous"; candidates: PersistedInspectEvent[] }
  | { status: "lookup-order-missing"; lookup: PersistedInspectEvent } {
  const orderId = stringArg(refund, "/orderId");
  if (!orderId) return { status: "missing" };

  const sameOrder = lookups.filter((event) => stringArg(event, "/orderId") === orderId);
  if (sameOrder.length === 0) return { status: "missing" };

  const refundOp = stringArg(refund, "/operationId");
  if (refundOp !== undefined) {
    const byOp = sameOrder.filter((event) => stringArg(event, "/operationId") === refundOp);
    if (byOp.length === 1) return { status: "ok", lookup: byOp[0]! };
    if (byOp.length === 0) return { status: "missing" };
    return { status: "ambiguous", candidates: byOp };
  }

  const distinctOps = new Set(
    sameOrder
      .map((event) => stringArg(event, "/operationId"))
      .filter((value): value is string => value !== undefined),
  );
  if (distinctOps.size > 1) {
    return { status: "ambiguous", candidates: [...sameOrder] };
  }

  const lookup = sameOrder[0]!;
  const lookupOrder = stringArg(lookup, "/orderId");
  if (!lookupOrder) return { status: "lookup-order-missing", lookup };
  return { status: "ok", lookup };
}

/**
 * Refund amount ≤ ceiling (USD number). Inspects finished and running attempts.
 */
export function createRefundAmountCeilingRule(): TraceCheckRule {
  return {
    id: "recipe.refund.amount-ceiling",
    category: "tool",
    defaultSeverity: "error",
    evaluate(context) {
      const findings: TraceCheckFinding[] = [];
      for (const event of toolsNamed(context, "issue_refund", { includeRunning: true })) {
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
              {
                amount: amount.amount,
                ...(event.status === "running" ? { attempted: true } : {}),
              },
            ),
          );
        }
      }
      return findings;
    },
  };
}

/**
 * Bind refund orderId to a same-run lookup_order with matching identity.
 * Unrelated earlier lookups for other orders do not steal the bind.
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
        const selected = selectLookupForRefund(refund, lookups);
        if (selected.status === "missing") {
          findings.push(
            fail(
              "recipe.refund.entity-bind",
              `No finished lookup_order in run ${refund.runId} matching refund identity.`,
              [evidenceFor(refund, "arguments.orderId")],
              {
                runId: refund.runId,
                orderId: order.value,
                operationId: stringArg(refund, "/operationId"),
              },
              { lookupCount: lookups.length },
            ),
          );
          continue;
        }
        if (selected.status === "ambiguous") {
          findings.push(
            fail(
              "recipe.refund.entity-bind",
              `Ambiguous lookup_order join for refund orderId ${order.value}; refuse conflicting candidates.`,
              [
                evidenceFor(refund, "arguments.orderId"),
                ...selected.candidates.map((event) => evidenceFor(event, "arguments.orderId")),
              ],
              { orderId: order.value, uniqueJoin: true },
              { candidateCount: selected.candidates.length },
            ),
          );
          continue;
        }
        if (selected.status === "lookup-order-missing") {
          findings.push(
            fail(
              "recipe.refund.entity-bind",
              "lookup_order orderId evidence missing or not a string.",
              [evidenceFor(selected.lookup, "arguments.orderId"), evidenceFor(refund)],
              "string orderId",
              argAt(selected.lookup, "/orderId").value,
            ),
          );
          continue;
        }
        const lookupOrder = stringArg(selected.lookup, "/orderId");
        if (lookupOrder !== order.value) {
          findings.push(
            fail(
              "recipe.refund.entity-bind",
              `Refund orderId ${order.value} does not match bound lookup_order ${lookupOrder} in run ${refund.runId}.`,
              [
                evidenceFor(selected.lookup, "arguments.orderId"),
                evidenceFor(refund, "arguments.orderId"),
              ],
              lookupOrder,
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
 * Amounts above APPROVAL_THRESHOLD_USD require a successful approval completed
 * before the refund starts, for the same order (and operationId when declared).
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

        const orderId = stringArg(refund, "/orderId");
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

        const refundStart = eventStartMs(refund);
        const refundOp = stringArg(refund, "/operationId");
        const approvals = finishedTools(context, "record_approval").filter((event) => {
          if (event.runId !== refund.runId) return false;
          if (event.status !== "ok") return false;
          if (stringArg(event, "/orderId") !== orderId) return false;
          const authorized = argAt(event, "/authorized");
          if (!authorized.present || authorized.value !== true) return false;
          if (refundOp !== undefined && stringArg(event, "/operationId") !== refundOp) {
            return false;
          }
          const approvalEnd = eventEndMs(event);
          if (refundStart === undefined || approvalEnd === undefined) return false;
          // Successful approval must complete before the refund starts.
          return approvalEnd <= refundStart;
        });

        if (approvals.length === 0) {
          findings.push(
            fail(
              "recipe.refund.approval-gate",
              `Refund ${amount.amount} USD for ${orderId} exceeds threshold ${APPROVAL_THRESHOLD_USD} USD without a successful record_approval completed before the refund.`,
              [evidenceFor(refund, "arguments.amount")],
              {
                unit: "USD",
                threshold: APPROVAL_THRESHOLD_USD,
                orderId,
                authorized: true,
                status: "ok",
                completedBeforeRefund: true,
                operationId: refundOp,
              },
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
