/**
 * v0.2 shared duration utilities.
 *
 * `parseDuration` is used for filters such as "since" / "older-than".
 * `formatDuration` is used for compact display in CLI and summaries.
 */

export function parseDuration(duration: string): number {
  const raw = typeof duration === "string" ? duration.trim() : "";
  const match = raw.match(/^(\d+)(ms|[smhd])$/);
  if (!match) {
    throw new Error(
      `Invalid duration format: ${duration}. Use a positive integer followed by ms, s, m, h, or d (e.g. 500ms, 30s, 5m, 2h, 7d).`,
    );
  }

  const amount = Number.parseInt(match[1], 10);
  const unit = match[2];

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(
      `Invalid duration amount: ${duration}. Amount must be a positive integer.`,
    );
  }

  switch (unit) {
    case "ms":
      return amount;
    case "s":
      return amount * 1000;
    case "m":
      return amount * 60 * 1000;
    case "h":
      return amount * 60 * 60 * 1000;
    case "d":
      return amount * 24 * 60 * 60 * 1000;
    default: {
      // Should be unreachable due to regex.
      throw new Error(`Unknown duration unit: ${unit}`);
    }
  }
}

export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms)) {
    return "0ms";
  }
  if (ms < 0) {
    throw new Error(`formatDuration: ms must be non-negative (got ${ms})`);
  }
  if (ms < 1000) {
    return `${Math.floor(ms)}ms`;
  }
  if (ms < 60_000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }
  if (ms < 3_600_000) {
    return `${(ms / 60_000).toFixed(1)}m`;
  }
  return `${(ms / 3_600_000).toFixed(1)}h`;
}

