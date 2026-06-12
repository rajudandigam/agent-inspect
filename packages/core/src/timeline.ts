import type {
  RunCompletedEvent,
  RunStartedEvent,
  StepCompletedEvent,
  StepStartedEvent,
  StepStatus,
  StepType,
  TraceEvent,
  TraceMetadataStatus,
} from "./types.js";
import { formatDuration, formatTimestamp } from "./utils.js";

export type TimelineFocus = "all" | "slow";

export interface TimelineEntry {
  stepId: string;
  name: string;
  type: StepType;
  status: StepStatus;
  depth: number;
  startedAt: number;
  offsetMs: number;
  durationMs?: number;
  isError: boolean;
  slow?: boolean;
  streaming?: {
    chunkCount?: number;
    streamDurationMs?: number;
    streamedCharCount?: number;
  };
}

export interface RunTimeline {
  runId: string;
  name?: string;
  status: TraceMetadataStatus;
  startedAt?: number;
  endedAt?: number;
  durationMs?: number;
  correlation?: {
    correlationId?: string;
    requestId?: string;
    decisionId?: string;
    groupId?: string;
  };
  entries: TimelineEntry[];
}

export interface TimelineOptions {
  focus?: TimelineFocus;
  slowTopN?: number;
}

function finite(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

function pickStreamingMeta(
  metadata: Record<string, unknown> | undefined,
): TimelineEntry["streaming"] | undefined {
  if (!metadata || typeof metadata !== "object") return undefined;
  const chunkCount = metadata.chunkCount;
  const streamDurationMs = metadata.streamDurationMs;
  const streamedCharCount = metadata.streamedCharCount;
  if (
    !finite(chunkCount) &&
    !finite(streamDurationMs) &&
    !finite(streamedCharCount)
  ) {
    return undefined;
  }
  return {
    ...(finite(chunkCount) ? { chunkCount } : {}),
    ...(finite(streamDurationMs) ? { streamDurationMs } : {}),
    ...(finite(streamedCharCount) ? { streamedCharCount } : {}),
  };
}

function pickCorrelation(
  metadata: Record<string, unknown> | undefined,
): RunTimeline["correlation"] | undefined {
  if (!metadata || typeof metadata !== "object") return undefined;
  const out: NonNullable<RunTimeline["correlation"]> = {};
  for (const key of [
    "correlationId",
    "requestId",
    "decisionId",
    "groupId",
  ] as const) {
    const v = metadata[key];
    if (typeof v === "string" && v.trim() !== "") {
      out[key] = v;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export function buildRunTimeline(
  events: TraceEvent[],
  options: TimelineOptions = {},
): RunTimeline {
  const started = events.find(
    (e): e is RunStartedEvent => e.event === "run_started",
  );
  const completed = events.filter(
    (e): e is RunCompletedEvent => e.event === "run_completed",
  );
  const lastCompleted = completed[completed.length - 1];

  const runId =
    started?.runId ??
    events.find((e) => typeof (e as { runId?: string }).runId === "string")
      ?.runId ??
    "unknown-run";

  const runStart =
    started && finite(started.startTime)
      ? started.startTime
      : started && finite(started.timestamp)
        ? started.timestamp
        : undefined;

  const status: TraceMetadataStatus = lastCompleted
    ? lastCompleted.status
    : started
      ? "running"
      : "unknown";

  const steps = new Map<
    string,
    {
      name: string;
      type: StepType;
      parentId?: string;
      startedAt: number;
      status: StepStatus;
      durationMs?: number;
      metadata?: Record<string, unknown>;
    }
  >();

  for (const e of events) {
    if (e.event === "step_started") {
      const s = e as StepStartedEvent;
      steps.set(s.stepId, {
        name: s.name,
        type: s.type,
        parentId: s.parentId,
        startedAt: finite(s.startTime) ? s.startTime : s.timestamp,
        status: "running",
        metadata: s.metadata as Record<string, unknown> | undefined,
      });
    }
  }

  for (const e of events) {
    if (e.event !== "step_completed") continue;
    const c = e as StepCompletedEvent;
    const node = steps.get(c.stepId);
    if (!node) continue;
    node.status = c.status;
    if (finite(c.durationMs)) node.durationMs = c.durationMs;
  }

  const depthCache = new Map<string, number>();
  const computeDepth = (stepId: string): number => {
    const cached = depthCache.get(stepId);
    if (cached !== undefined) return cached;
    const node = steps.get(stepId);
    if (!node) return 0;
    const parent = node.parentId;
    if (
      typeof parent !== "string" ||
      parent.trim() === "" ||
      !steps.has(parent)
    ) {
      depthCache.set(stepId, 0);
      return 0;
    }
    const d = Math.min(1000, computeDepth(parent) + 1);
    depthCache.set(stepId, d);
    return d;
  };

  const entries: TimelineEntry[] = [];
  for (const [stepId, s] of steps.entries()) {
    const offsetMs =
      runStart !== undefined && finite(s.startedAt)
        ? Math.max(0, s.startedAt - runStart)
        : 0;
    entries.push({
      stepId,
      name: s.name,
      type: s.type,
      status: s.status,
      depth: computeDepth(stepId),
      startedAt: s.startedAt,
      offsetMs,
      durationMs: s.durationMs,
      isError: s.status === "error",
      streaming: pickStreamingMeta(s.metadata),
    });
  }

  entries.sort((a, b) => a.startedAt - b.startedAt);

  const slowTopN = options.slowTopN ?? 3;
  if (options.focus === "slow" && entries.length > 0) {
    const ranked = [...entries]
      .filter((e) => finite(e.durationMs))
      .sort((a, b) => (b.durationMs ?? 0) - (a.durationMs ?? 0));
    const slowIds = new Set(
      ranked.slice(0, slowTopN).map((e) => e.stepId),
    );
    for (const e of entries) {
      if (slowIds.has(e.stepId)) e.slow = true;
    }
  }

  return {
    runId,
    name:
      typeof started?.name === "string" && started.name.trim() !== ""
        ? started.name
        : undefined,
    status,
    startedAt: runStart,
    endedAt:
      lastCompleted && finite(lastCompleted.endTime)
        ? lastCompleted.endTime
        : undefined,
    durationMs:
      lastCompleted && finite(lastCompleted.durationMs)
        ? lastCompleted.durationMs
        : undefined,
    correlation: pickCorrelation(
      started?.metadata as Record<string, unknown> | undefined,
    ),
    entries,
  };
}

export interface RenderTimelineOptions {
  focus?: TimelineFocus;
}

export function renderTimeline(
  timeline: RunTimeline,
  options: RenderTimelineOptions = {},
): string {
  const lines: string[] = [];
  lines.push(`Timeline: ${timeline.name ?? timeline.runId}`);
  lines.push(`Run ID: ${timeline.runId}`);
  lines.push(`Status: ${timeline.status}`);
  if (timeline.startedAt !== undefined) {
    lines.push(`Started: ${formatTimestamp(timeline.startedAt)}`);
  }
  if (timeline.durationMs !== undefined) {
    lines.push(`Duration: ${formatDuration(timeline.durationMs)}`);
  }
  if (timeline.correlation) {
    const parts = Object.entries(timeline.correlation)
      .filter(([, v]) => typeof v === "string")
      .map(([k, v]) => `${k}=${v}`);
    if (parts.length > 0) {
      lines.push(`Correlation: ${parts.join(", ")}`);
    }
  }
  lines.push("");
  lines.push("Steps (chronological):");

  const show = timeline.entries.filter((e) => {
    if (options.focus === "slow") return e.slow === true;
    return true;
  });

  if (show.length === 0) {
    lines.push(
      options.focus === "slow"
        ? "(no steps with duration for slow focus)"
        : "(no steps)",
    );
    return lines.join("\n");
  }

  for (const e of show) {
    const prefix = e.slow ? "[slow] " : "";
    const typeTag =
      e.type === "llm" ? "llm" : e.type === "tool" ? "tool" : e.type;
    const dur =
      e.durationMs !== undefined ? formatDuration(e.durationMs) : "-";
    const err = e.isError ? " error" : "";
    const off = formatDuration(e.offsetMs);
    let line = `${prefix}+${off} ${typeTag}:${e.name} (${dur})${err}`;
    if (e.streaming?.chunkCount !== undefined) {
      line += ` chunks=${e.streaming.chunkCount}`;
    }
    if (e.streaming?.streamDurationMs !== undefined) {
      line += ` stream=${formatDuration(e.streaming.streamDurationMs)}`;
    }
    lines.push(line);
  }

  return lines.join("\n");
}
