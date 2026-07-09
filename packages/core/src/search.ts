import type { StepCompletedEvent, StepStartedEvent, TraceEvent } from "./types.js";
import { extractMetadata } from "./trace-metadata.js";
import { filterTraces as filterTraceMetas } from "./trace-filter.js";
import { readTraceEventsFromFile } from "./storage.js";
import type { TraceMetadata, StepType } from "./types.js";
import { parseDuration } from "./utils/duration.js";
import {
  extractOutcomesFromTraceEvents,
  parseObservationFilter,
} from "./outcomes/index.js";

export interface TraceSearchOptions {
  traceDir: string;
  since?: string;
  status?: "success" | "error" | "running" | "unknown";
  kind?: string;
  type?: string;
  name?: string;
  tool?: string;
  duration?: string;
  limit?: number;
  session?: string;
  correlateGroup?: boolean;
  observation?: string;
}

export interface TraceSearchResult {
  runId: string;
  runName?: string;
  runStatus: string;
  stepId?: string;
  stepName?: string;
  stepType?: string;
  timestamp?: number;
  durationMs?: number;
  matchReason: string;
  matchedFields: string[];
  filePath: string;
  sessionId?: string;
}

export interface ParsedDurationFilter {
  op: ">" | ">=" | "<" | "<=";
  ms: number;
}

export function parseDurationFilter(expr: string): ParsedDurationFilter {
  const raw = expr.trim();
  const m = raw.match(/^(>=|<=|>|<)\s*(.+)$/);
  if (!m) {
    throw new Error(
      `Invalid --duration "${expr}". Use forms like >5s, >=500ms, <2m.`,
    );
  }
  const op = m[1] as ParsedDurationFilter["op"];
  const ms = parseDuration(m[2].trim());
  return { op, ms };
}

function durationMatches(
  valueMs: number | undefined,
  filter: ParsedDurationFilter,
): boolean {
  if (valueMs === undefined || !Number.isFinite(valueMs)) return false;
  switch (filter.op) {
    case ">":
      return valueMs > filter.ms;
    case ">=":
      return valueMs >= filter.ms;
    case "<":
      return valueMs < filter.ms;
    case "<=":
      return valueMs <= filter.ms;
    default:
      return false;
  }
}

function normalizeStepTypeFilter(kind?: string, type?: string): string | undefined {
  const v = (kind ?? type)?.trim().toLowerCase();
  return v && v !== "" ? v : undefined;
}

function nameMatches(hay: string, needle: string): boolean {
  return hay.toLowerCase().includes(needle.toLowerCase());
}

export async function searchTraces(
  metas: TraceMetadata[],
  options: TraceSearchOptions,
): Promise<TraceSearchResult[]> {
  let filtered = filterTraceMetas(metas, { since: options.since });
  const stepTypeFilter = normalizeStepTypeFilter(options.kind, options.type);
  const nameQuery = options.name?.trim();
  const toolQuery = options.tool?.trim();
  let durationFilter: ParsedDurationFilter | undefined;
  if (options.duration) {
    durationFilter = parseDurationFilter(options.duration);
  }
  const limit = options.limit ?? 50;
  const sessionId = options.session?.trim();
  const observationStatus = parseObservationFilter(options.observation);

  const hasContentFilter = Boolean(
    options.status ||
      stepTypeFilter ||
      nameQuery ||
      toolQuery ||
      durationFilter ||
      observationStatus,
  );

  const results: TraceSearchResult[] = [];
  const sessionLabel = sessionId && sessionId !== "" ? sessionId : undefined;

  if (!hasContentFilter) {
    for (const m of filtered) {
      results.push({
        runId: m.runId,
        runName: m.name,
        runStatus: m.status,
        timestamp: m.startedAt,
        durationMs: m.durationMs,
        matchReason: sessionLabel
          ? `trace in session ${sessionLabel}`
          : "trace in directory",
        matchedFields: sessionLabel ? ["run", "session"] : ["run"],
        filePath: m.filePath,
        ...(sessionLabel ? { sessionId: sessionLabel } : {}),
      });
    }
    return results.slice(0, limit);
  }

  for (const m of filtered) {
    if (options.status && m.status !== options.status) continue;

    let events: TraceEvent[] = [];
    try {
      events = await readTraceEventsFromFile(m.filePath);
    } catch {
      continue;
    }
    if (events.length === 0) continue;

    const runMatches = matchRunLevel(m, {
      stepTypeFilter,
      nameQuery,
      toolQuery,
      durationFilter,
      statusFilter: options.status,
    });
    results.push(...runMatches);

    const stepMatches = matchStepLevel(m, events, {
      stepTypeFilter,
      nameQuery,
      toolQuery,
      durationFilter,
      statusFilter: options.status,
    });
    results.push(...stepMatches);

    if (observationStatus) {
      const outcomes = extractOutcomesFromTraceEvents(events);
      const matched = outcomes.filter((outcome) => outcome.status === observationStatus);
      for (const outcome of matched) {
        results.push({
          runId: m.runId,
          runName: m.name,
          runStatus: m.status,
          stepName: outcome.name,
          timestamp: outcome.observedAt,
          matchReason: `observation status=${outcome.status}`,
          matchedFields: ["outcome.status", "outcome.name"],
          filePath: m.filePath,
        });
      }
    }
  }

  results.sort((a, b) => {
    const ta = a.timestamp ?? 0;
    const tb = b.timestamp ?? 0;
    if (ta !== tb) return ta - tb;
    const runCmp = a.runId.localeCompare(b.runId);
    if (runCmp !== 0) return runCmp;
    return (a.stepName ?? "").localeCompare(b.stepName ?? "");
  });

  return results.slice(0, limit);
}

function matchRunLevel(
  m: TraceMetadata,
  opts: {
    stepTypeFilter?: string;
    nameQuery?: string;
    toolQuery?: string;
    durationFilter?: ParsedDurationFilter;
    statusFilter?: string;
  },
): TraceSearchResult[] {
  if (opts.stepTypeFilter || opts.toolQuery) return [];
  const out: TraceSearchResult[] = [];
  const fields: string[] = [];

  if (opts.statusFilter && m.status === opts.statusFilter) {
    fields.push("run.status");
  }
  if (opts.nameQuery && nameMatches(m.name ?? m.runId, opts.nameQuery)) {
    fields.push("run.name");
  }
  if (
    opts.durationFilter &&
    durationMatches(m.durationMs, opts.durationFilter)
  ) {
    fields.push("run.durationMs");
  }

  if (fields.length === 0) return out;

  out.push({
    runId: m.runId,
    runName: m.name,
    runStatus: m.status,
    timestamp: m.startedAt,
    durationMs: m.durationMs,
    matchReason: `run match: ${fields.join(", ")}`,
    matchedFields: fields,
    filePath: m.filePath,
  });
  return out;
}

function matchStepLevel(
  m: TraceMetadata,
  events: TraceEvent[],
  opts: {
    stepTypeFilter?: string;
    nameQuery?: string;
    toolQuery?: string;
    durationFilter?: ParsedDurationFilter;
    statusFilter?: string;
  },
): TraceSearchResult[] {
  const out: TraceSearchResult[] = [];
  const started = new Map<string, StepStartedEvent>();

  for (const e of events) {
    if (e.event === "step_started") {
      started.set((e as StepStartedEvent).stepId, e as StepStartedEvent);
    }
  }

  for (const e of events) {
    if (e.event !== "step_completed") continue;
    const c = e as StepCompletedEvent;
    const s = started.get(c.stepId);
    if (!s) continue;

    const fields: string[] = [];
    const stepType = s.type as StepType;

    if (opts.stepTypeFilter && stepType !== opts.stepTypeFilter) {
      continue;
    }

    const hasStepFilters =
      opts.stepTypeFilter ||
      opts.nameQuery ||
      opts.toolQuery ||
      opts.durationFilter ||
      opts.statusFilter === "error" ||
      opts.statusFilter === "success";

    if (!hasStepFilters) continue;

    if (opts.statusFilter === "error" && c.status === "error") {
      fields.push("step.status");
    } else if (opts.statusFilter === "success" && c.status === "success") {
      fields.push("step.status");
    } else if (opts.statusFilter === "error" || opts.statusFilter === "success") {
      continue;
    }

    if (opts.nameQuery) {
      if (!nameMatches(s.name, opts.nameQuery)) continue;
      fields.push("step.name");
    }
    if (opts.toolQuery) {
      const toolName =
        typeof s.metadata?.toolName === "string"
          ? s.metadata.toolName
          : s.name;
      if (!nameMatches(toolName, opts.toolQuery)) continue;
      fields.push("step.tool");
    }
    if (opts.durationFilter) {
      if (!durationMatches(c.durationMs, opts.durationFilter)) continue;
      fields.push("step.durationMs");
    }
    if (opts.stepTypeFilter) {
      fields.push("step.type");
    }

    if (fields.length === 0) continue;

    out.push({
      runId: m.runId,
      runName: m.name,
      runStatus: m.status,
      stepId: c.stepId,
      stepName: s.name,
      stepType,
      timestamp: s.startTime ?? s.timestamp,
      durationMs: c.durationMs,
      matchReason: `step match: ${fields.join(", ")}`,
      matchedFields: fields,
      filePath: m.filePath,
    });
  }

  return out;
}

export async function loadTraceMetadataList(
  _traceDir: string,
  fileNames: string[],
  getPath: (fileName: string) => string,
): Promise<TraceMetadata[]> {
  const metas: TraceMetadata[] = [];
  for (const fileName of fileNames) {
    try {
      const filePath = getPath(fileName);
      const meta = await extractMetadata(filePath);
      metas.push(meta);
    } catch {
      /* skip */
    }
  }
  return metas;
}
