import type { TraceSafetyOptions } from "../trace-event-safety.js";
import type { PersistedInspectEvent } from "../types/persisted-inspect-event.js";

const writeTraceSafety = Symbol.for("agent-inspect.writeTraceSafety");

function isBound(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isTraceSafetyOptions(value: unknown): value is TraceSafetyOptions {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<TraceSafetyOptions>;
  return (
    typeof candidate.redactEnabled === "boolean" &&
    typeof candidate.redactionProfile === "string" &&
    Array.isArray(candidate.profileExtraKeys) &&
    isBound(candidate.maxMetadataValueLength) &&
    isBound(candidate.maxPreviewLength) &&
    isBound(candidate.maxEventBytes)
  );
}

export function withWriteTraceSafety(
  event: PersistedInspectEvent,
  traceSafety: TraceSafetyOptions,
): PersistedInspectEvent {
  Object.defineProperty(event, writeTraceSafety, {
    value: traceSafety,
    configurable: true,
  });
  return event;
}

export function writeTraceSafetyOf(event: unknown): TraceSafetyOptions | undefined {
  try {
    if (typeof event !== "object" || event === null) return undefined;
    const carried = Object.getOwnPropertyDescriptor(event, writeTraceSafety)?.value;
    return isTraceSafetyOptions(carried) ? carried : undefined;
  } catch {
    return undefined;
  }
}
