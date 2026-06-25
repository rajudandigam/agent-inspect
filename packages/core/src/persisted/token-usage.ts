import type { PersistedTokenUsage } from "../types/persisted-inspect-event.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonNegativeFinite(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : undefined;
}

/**
 * Keeps the approved token vocabulary and derives total only when it is absent.
 * Cached tokens are informational and are never added to total.
 */
export function normalizeTokenUsage(
  value: unknown,
): PersistedTokenUsage | undefined {
  if (!isRecord(value)) return undefined;

  const input = nonNegativeFinite(value.input);
  const output = nonNegativeFinite(value.output);
  const suppliedTotal = nonNegativeFinite(value.total);
  const cached = nonNegativeFinite(value.cached);
  const derivedTotal =
    input !== undefined && output !== undefined && Number.isFinite(input + output)
      ? input + output
      : undefined;
  const total =
    suppliedTotal ?? derivedTotal;

  if (
    input === undefined &&
    output === undefined &&
    total === undefined &&
    cached === undefined
  ) {
    return undefined;
  }

  return {
    ...(input !== undefined ? { input } : {}),
    ...(output !== undefined ? { output } : {}),
    ...(total !== undefined ? { total } : {}),
    ...(cached !== undefined ? { cached } : {}),
  };
}
