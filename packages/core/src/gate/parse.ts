export function parseGateList(value: string | undefined): string[] {
  if (value === undefined || value.trim() === "") return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function parseGateNumber(
  value: string | undefined,
  label: string,
  options: { min?: number; max?: number } = {},
): number | undefined {
  if (value === undefined || value.trim() === "") return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid ${label}: ${value}`);
  }
  if (options.min !== undefined && parsed < options.min) {
    throw new Error(`${label} must be at least ${options.min}.`);
  }
  if (options.max !== undefined && parsed > options.max) {
    throw new Error(`${label} must be at most ${options.max}.`);
  }
  return parsed;
}
