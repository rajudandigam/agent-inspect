import type { TraceSafetyOptions } from "../trace-event-safety.js";
import { prepareMetadataForDisk } from "../trace-event-safety.js";
import type { OutcomeObservedEvent } from "../types.js";
import {
  OBSERVED_OUTCOME_METHODS,
  OBSERVED_OUTCOME_STATUSES,
  type ObserveOutcomeOptions,
  type ObservedOutcomeMethod,
  type ObservedOutcomeStatus,
} from "./types.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeName(name: string): string {
  const trimmed = name.trim();
  if (trimmed === "") {
    throw new Error("observeOutcome requires a non-empty name.");
  }
  return trimmed.slice(0, 100);
}

function normalizeExpectation(value: string): string {
  const trimmed = value.trim();
  if (trimmed === "") {
    throw new Error("observeOutcome requires a non-empty expectation.");
  }
  return trimmed.slice(0, 500);
}

export function parseObservedOutcomeStatus(value: string): ObservedOutcomeStatus {
  const trimmed = value.trim().toLowerCase();
  if ((OBSERVED_OUTCOME_STATUSES as readonly string[]).includes(trimmed)) {
    return trimmed as ObservedOutcomeStatus;
  }
  throw new Error(
    `Unsupported observation status "${value}". Use passed, failed, unknown, or skipped.`,
  );
}

function parseMethod(value: string | undefined): ObservedOutcomeMethod | undefined {
  if (value === undefined || value.trim() === "") return undefined;
  const trimmed = value.trim().toLowerCase();
  if ((OBSERVED_OUTCOME_METHODS as readonly string[]).includes(trimmed)) {
    return trimmed as ObservedOutcomeMethod;
  }
  throw new Error(`Unsupported observation method "${value}".`);
}

function parseObservedAt(value: number | string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export function normalizeObserveOutcomeInput(
  name: string,
  options: ObserveOutcomeOptions,
  nowMs: number = Date.now(),
): {
  name: string;
  expectation: string;
  status: ObservedOutcomeStatus;
  method?: ObservedOutcomeMethod;
  actual?: unknown;
  evidence?: unknown;
  observedAt: number;
} {
  return {
    name: normalizeName(name),
    expectation: normalizeExpectation(options.expectation),
    status: options.status,
    ...(options.method !== undefined ? { method: parseMethod(options.method) } : {}),
    ...(options.actual !== undefined ? { actual: options.actual } : {}),
    ...(options.evidence !== undefined ? { evidence: options.evidence } : {}),
    observedAt: parseObservedAt(options.observedAt, nowMs),
  };
}

function boundPayload(
  value: unknown,
  opts: TraceSafetyOptions,
): unknown {
  if (value === undefined) return undefined;
  if (!isRecord(value) && !Array.isArray(value)) {
    if (typeof value === "string") {
      return value.length > opts.maxMetadataValueLength
        ? `${value.slice(0, opts.maxMetadataValueLength)}…`
        : value;
    }
    return value;
  }
  return prepareMetadataForDisk(
    isRecord(value) ? value : { items: value },
    opts,
  );
}

export function prepareOutcomeEventForDisk(
  event: OutcomeObservedEvent,
  opts: TraceSafetyOptions,
): OutcomeObservedEvent {
  const actual = boundPayload(event.actual, opts);
  const evidence = boundPayload(event.evidence, opts);
  const next: OutcomeObservedEvent = {
    ...event,
    ...(actual !== undefined ? { actual } : {}),
    ...(evidence !== undefined ? { evidence } : {}),
  };
  if ("actual" in event && actual === undefined) {
    const { actual: _a, ...rest } = next;
    return rest;
  }
  if ("evidence" in event && evidence === undefined) {
    const { evidence: _e, ...rest } = next;
    return rest;
  }
  return next;
}
