import { stat } from "node:fs/promises";
import path from "node:path";

import type {
  RunCompletedEvent,
  RunStartedEvent,
  StepCompletedEvent,
  StepStartedEvent,
  TraceEvent,
  TraceMetadata,
  TraceMetadataStatus,
  RunSummary,
  StepType,
  StepStatus,
} from "./types.js";
import { readFile } from "node:fs/promises";
import { isTraceEvent } from "./types.js";

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function safeParseJson(line: string): unknown | undefined {
  try {
    return JSON.parse(line) as unknown;
  } catch {
    return undefined;
  }
}

export async function extractMetadata(
  filePath: string,
  _quickScan?: boolean,
): Promise<TraceMetadata> {
  const stats = await stat(filePath);

  let runIdFromFile = path.basename(filePath);
  if (runIdFromFile.endsWith(".jsonl")) {
    runIdFromFile = runIdFromFile.slice(0, -".jsonl".length);
  }

  const raw = await readFile(filePath, "utf-8");
  const lines = raw.split(/\r?\n/);

  let eventCount = 0;
  let runId: string | undefined;
  let name: string | undefined;
  let startedAt: number | undefined;
  let endedAt: number | undefined;
  let explicitDurationMs: number | undefined;

  let hasRunStarted = false;
  let hasRunCompleted = false;
  let runCompletedStatus: "success" | "error" | undefined;
  let anyStepError = false;
  let anyKnownEvent = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "") continue;
    const parsed = safeParseJson(trimmed);
    if (!parsed) continue;
    if (!isTraceEvent(parsed)) continue;

    const e = parsed as TraceEvent;
    anyKnownEvent = true;
    eventCount += 1;

    if (runId === undefined && typeof (e as any).runId === "string") {
      runId = (e as any).runId as string;
    }

    if (e.event === "run_started") {
      hasRunStarted = true;
      const rs = e as RunStartedEvent;
      if (typeof rs.name === "string" && rs.name.trim() !== "") {
        name = rs.name;
      }
      if (isFiniteNumber(rs.startTime)) {
        startedAt = rs.startTime;
      } else if (isFiniteNumber(rs.timestamp)) {
        startedAt = rs.timestamp;
      }
    }

    if (e.event === "run_completed") {
      hasRunCompleted = true;
      const rc = e as RunCompletedEvent;
      runCompletedStatus = rc.status;
      if (isFiniteNumber(rc.endTime)) endedAt = rc.endTime;
      else if (isFiniteNumber(rc.timestamp)) endedAt = rc.timestamp;
      if (isFiniteNumber(rc.durationMs)) explicitDurationMs = rc.durationMs;
    }

    if (e.event === "step_completed") {
      const sc = e as StepCompletedEvent;
      if (sc.status === "error") {
        anyStepError = true;
      }
    }
  }

  const resolvedRunId = runId ?? runIdFromFile;

  let status: TraceMetadataStatus = "unknown";
  if (hasRunCompleted && (runCompletedStatus === "success" || runCompletedStatus === "error")) {
    status = runCompletedStatus;
  } else if (anyStepError) {
    // If run_completed is missing, but at least one step failed, treat as error.
    status = "error";
  } else if (hasRunStarted && !hasRunCompleted) {
    status = "running";
  } else if (anyKnownEvent) {
    status = "unknown";
  } else {
    status = "unknown";
  }

  const durationMs =
    explicitDurationMs ??
    (startedAt !== undefined &&
    endedAt !== undefined &&
    Number.isFinite(startedAt) &&
    Number.isFinite(endedAt) &&
    endedAt >= startedAt
      ? endedAt - startedAt
      : undefined);

  return {
    runId: resolvedRunId,
    name,
    status,
    startedAt,
    endedAt,
    durationMs,
    eventCount,
    filePath,
    fileSize: stats.size,
    createdAt: stats.birthtime,
  };
}

type StepAgg = {
  type: StepType;
  name: string;
  status: StepStatus;
  durationMs?: number;
  parentId?: string;
  tokensInput?: number;
  tokensOutput?: number;
};

export function buildRunSummary(events: TraceEvent[]): RunSummary {
  const started = events.find(
    (e): e is RunStartedEvent => e.event === "run_started",
  );
  const completed = events.filter(
    (e): e is RunCompletedEvent => e.event === "run_completed",
  );
  const lastCompleted = completed[completed.length - 1];

  const runId = started?.runId ?? events.find((e: any) => typeof e.runId === "string")?.runId ?? "unknown-run";

  const name =
    typeof started?.name === "string" && started.name.trim() !== ""
      ? started.name
      : undefined;

  const status: TraceMetadataStatus = lastCompleted
    ? lastCompleted.status
    : started
      ? "running"
      : "unknown";

  const durationMs =
    lastCompleted && isFiniteNumber(lastCompleted.durationMs)
      ? lastCompleted.durationMs
      : undefined;

  const startedAt =
    started && isFiniteNumber(started.startTime)
      ? started.startTime
      : undefined;

  const steps = new Map<string, StepAgg>();

  for (const e of events) {
    if (e.event === "step_started") {
      const s = e as StepStartedEvent;
      steps.set(s.stepId, {
        type: s.type,
        name: s.name,
        status: "running",
        parentId: s.parentId,
        tokensInput:
          typeof s.metadata?.tokens?.input === "number" ? s.metadata.tokens.input : undefined,
        tokensOutput:
          typeof s.metadata?.tokens?.output === "number" ? s.metadata.tokens.output : undefined,
      });
    }
  }

  for (const e of events) {
    if (e.event === "step_completed") {
      const c = e as StepCompletedEvent;
      const existing = steps.get(c.stepId);
      if (!existing) continue;
      existing.status = c.status;
      existing.durationMs = c.durationMs;
    }
  }

  let totalSteps = 0;
  let llmSteps = 0;
  let toolSteps = 0;
  let logicSteps = 0;
  let errorSteps = 0;
  let maxDepth = 0;
  let longestStep: RunSummary["longestStep"] | undefined;

  let totalTokensInput = 0;
  let totalTokensOutput = 0;
  let hasAnyTokens = false;

  const depthCache = new Map<string, number>();
  const computeDepth = (stepId: string): number => {
    const cached = depthCache.get(stepId);
    if (cached !== undefined) return cached;
    const node = steps.get(stepId);
    if (!node) return 0;
    const parent = node.parentId;
    if (typeof parent !== "string" || parent.trim() === "" || !steps.has(parent)) {
      depthCache.set(stepId, 0);
      return 0;
    }
    // Depth is parent depth + 1. Cap at a sane limit to avoid cycles.
    const d = Math.min(1000, computeDepth(parent) + 1);
    depthCache.set(stepId, d);
    return d;
  };

  for (const [id, s] of steps.entries()) {
    totalSteps += 1;
    if (s.type === "llm") llmSteps += 1;
    else if (s.type === "tool") toolSteps += 1;
    else logicSteps += 1;

    if (s.status === "error") errorSteps += 1;
    const depth = computeDepth(id);
    if (depth > maxDepth) maxDepth = depth;

    if (typeof s.durationMs === "number" && Number.isFinite(s.durationMs)) {
      if (!longestStep || s.durationMs > longestStep.durationMs) {
        longestStep = { name: s.name, durationMs: s.durationMs, type: s.type };
      }
    }

    if (typeof s.tokensInput === "number" || typeof s.tokensOutput === "number") {
      hasAnyTokens = true;
      if (typeof s.tokensInput === "number") totalTokensInput += s.tokensInput;
      if (typeof s.tokensOutput === "number") totalTokensOutput += s.tokensOutput;
    }
  }

  const summary: RunSummary = {
    runId,
    name,
    status,
    durationMs,
    totalSteps,
    llmSteps,
    toolSteps,
    logicSteps,
    errorSteps,
    maxDepth,
    ...(longestStep ? { longestStep } : {}),
    ...(hasAnyTokens
      ? { totalTokens: { input: totalTokensInput, output: totalTokensOutput } }
      : {}),
  };

  // startedAt isn't in RunSummary spec, but keep deterministic results: ignore.
  void startedAt;
  return summary;
}

