import {
  getCurrentContext,
  getParentStepId,
  getTraceSafetyFromContext,
} from "./context.js";
import {
  normalizeObserveOutcomeInput,
  prepareOutcomeEventForDisk,
  type ObserveOutcomeOptions,
} from "./outcomes/index.js";
import type { OutcomeObservedEvent } from "./types.js";
import { writeTraceEvent } from "./storage.js";
import { createStepId, warn } from "./utils.js";

async function safeWrite(label: string, op: () => Promise<void>): Promise<void> {
  try {
    await op();
  } catch (error) {
    warn(`observeOutcome: ${label}`, error);
  }
}

/**
 * Records an observed real-world outcome inside an active `inspectRun` context.
 * Outside a run, logs a warning and returns without throwing.
 */
export async function observeOutcome(
  name: string,
  options: ObserveOutcomeOptions,
): Promise<void> {
  const context = getCurrentContext();
  if (!context) {
    warn("observeOutcome() called outside inspectRun(); skipping");
    return;
  }

  let normalized;
  try {
    normalized = normalizeObserveOutcomeInput(name, options);
  } catch (error) {
    warn("observeOutcome() invalid arguments", error);
    return;
  }

  const traceSafety = getTraceSafetyFromContext();
  const parentId = getParentStepId();
  const event: OutcomeObservedEvent = {
    schemaVersion: "0.1",
    event: "outcome_observed",
    timestamp: normalized.observedAt,
    runId: context.runId,
    outcomeId: createStepId(),
    ...(parentId !== undefined ? { parentId } : {}),
    name: normalized.name,
    expectation: normalized.expectation,
    status: normalized.status,
    ...(normalized.method !== undefined ? { method: normalized.method } : {}),
    ...(normalized.actual !== undefined ? { actual: normalized.actual } : {}),
    ...(normalized.evidence !== undefined ? { evidence: normalized.evidence } : {}),
    observedAt: normalized.observedAt,
  };

  const prepared =
    traceSafety !== undefined
      ? prepareOutcomeEventForDisk(event, traceSafety)
      : event;

  await safeWrite("writeTraceEvent", async () => {
    await writeTraceEvent(prepared, context.traceDir);
  });
}

export type { ObserveOutcomeOptions } from "./outcomes/index.js";
