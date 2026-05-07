import type { TraceMetadata, TraceMetadataStatus } from "./types.js";
import { parseDuration } from "./utils/duration.js";

export interface TraceFilterOptions {
  status?: TraceMetadataStatus;
  name?: string;
  since?: string;
  limit?: number;
}

function toLower(s: string | undefined): string {
  return typeof s === "string" ? s.toLowerCase() : "";
}

export function filterTraces(
  traces: TraceMetadata[],
  options: TraceFilterOptions,
): TraceMetadata[] {
  const input = [...traces];

  let out = input.filter((t) => {
    if (options.status && t.status !== options.status) return false;

    if (options.name) {
      const q = options.name.toLowerCase();
      const hay = `${toLower(t.name)} ${toLower(t.runId)}`;
      if (!hay.includes(q)) return false;
    }

    if (options.since) {
      const windowMs = parseDuration(options.since);
      const cutoff = Date.now() - windowMs;
      const started = typeof t.startedAt === "number" ? t.startedAt : undefined;
      const basis = started ?? t.createdAt.getTime();
      if (!Number.isFinite(basis) || basis < cutoff) return false;
    }

    return true;
  });

  out.sort((a, b) => {
    const aTime = (typeof a.startedAt === "number" ? a.startedAt : undefined) ?? a.createdAt.getTime();
    const bTime = (typeof b.startedAt === "number" ? b.startedAt : undefined) ?? b.createdAt.getTime();
    return bTime - aTime;
  });

  if (typeof options.limit === "number" && Number.isFinite(options.limit)) {
    const n = Math.max(0, Math.floor(options.limit));
    out = out.slice(0, n);
  }

  return out;
}

