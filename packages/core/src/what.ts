import type {
  RunCompletedEvent,
  RunStartedEvent,
  StepCompletedEvent,
  StepStartedEvent,
  TraceCorrelationMetadata,
  TraceEvent,
  TraceMetadataStatus,
} from "./types.js";
import { buildRunSummary } from "./trace-metadata.js";
import { formatDuration } from "./utils.js";

export interface RunWhatSummary {
  runId: string;
  name?: string;
  status: TraceMetadataStatus;
  durationMs?: number;
  totalSteps: number;
  llmSteps: number;
  toolSteps: number;
  logicSteps: number;
  errorSteps: number;
  maxDepth: number;
  longestStep?: {
    name: string;
    durationMs: number;
    type: string;
  };
  totalTokens?: {
    input: number;
    output: number;
  };
  correlation?: TraceCorrelationMetadata;
  failedStepNames: string[];
  runErrorMessage?: string;
}

function pickCorrelation(
  metadata: Record<string, unknown> | undefined,
): TraceCorrelationMetadata | undefined {
  if (!metadata) return undefined;
  const out: TraceCorrelationMetadata = {};
  for (const key of [
    "correlationId",
    "requestId",
    "decisionId",
    "groupId",
  ] as const) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim() !== "") {
      out[key] = value;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function stepMixLine(summary: RunWhatSummary): string {
  const parts: string[] = [];
  if (summary.llmSteps > 0) parts.push(`${summary.llmSteps} LLM`);
  if (summary.toolSteps > 0) parts.push(`${summary.toolSteps} tool`);
  if (summary.logicSteps > 0) parts.push(`${summary.logicSteps} logic`);
  return parts.length > 0 ? parts.join(", ") : "none";
}

function outcomeLine(summary: RunWhatSummary): string {
  if (summary.status === "success") {
    return summary.errorSteps > 0
      ? "Completed with step errors recorded."
      : "Completed successfully.";
  }
  if (summary.status === "error") {
    if (summary.failedStepNames.length > 0) {
      const names = summary.failedStepNames.slice(0, 3).join(", ");
      const suffix =
        summary.failedStepNames.length > 3
          ? ` (+${summary.failedStepNames.length - 3} more)`
          : "";
      return `Failed at step(s): ${names}${suffix}.`;
    }
    if (summary.runErrorMessage) {
      return `Run failed: ${summary.runErrorMessage}`;
    }
    return "Run failed.";
  }
  if (summary.status === "running") {
    return "Run is still in progress (no run_completed).";
  }
  return "Outcome unknown — inspect events may be incomplete.";
}

/**
 * Build a concise inspection summary for `what` / report workflows.
 * Read-only over in-memory v0.1 {@link TraceEvent} rows.
 */
export function buildRunWhatSummary(events: TraceEvent[]): RunWhatSummary {
  const base = buildRunSummary(events);
  const started = events.find(
    (e): e is RunStartedEvent => e.event === "run_started",
  );
  const completed = events.filter(
    (e): e is RunCompletedEvent => e.event === "run_completed",
  );
  const lastCompleted = completed[completed.length - 1];

  const failedStepNames: string[] = [];
  const stepNames = new Map<string, string>();
  for (const e of events) {
    if (e.event === "step_started") {
      const s = e as StepStartedEvent;
      stepNames.set(s.stepId, s.name);
    }
  }
  for (const e of events) {
    if (e.event === "step_completed") {
      const sc = e as StepCompletedEvent;
      if (sc.status === "error") {
        failedStepNames.push(stepNames.get(sc.stepId) ?? sc.stepId);
      }
    }
  }

  return {
    runId: base.runId,
    name: base.name,
    status: base.status,
    durationMs: base.durationMs,
    totalSteps: base.totalSteps,
    llmSteps: base.llmSteps,
    toolSteps: base.toolSteps,
    logicSteps: base.logicSteps,
    errorSteps: base.errorSteps,
    maxDepth: base.maxDepth,
    longestStep: base.longestStep,
    totalTokens: base.totalTokens,
    correlation: pickCorrelation(started?.metadata),
    failedStepNames,
    runErrorMessage: lastCompleted?.error?.message,
  };
}

export interface RenderWhatOptions {
  /** Include correlation ids when present (default true). */
  correlation?: boolean;
}

/**
 * Render a human-readable `what` summary (plain text, no ANSI).
 */
export function renderRunWhat(
  summary: RunWhatSummary,
  options: RenderWhatOptions = {},
): string {
  const showCorrelation = options.correlation !== false;
  const lines: string[] = [];
  const label = summary.name ?? summary.runId;
  lines.push(`What: ${label}`);

  const duration =
    summary.durationMs !== undefined ? formatDuration(summary.durationMs) : "—";
  lines.push(
    `Status: ${summary.status} · Duration: ${duration} · Steps: ${summary.totalSteps} (${stepMixLine(summary)})`,
  );

  if (summary.totalTokens) {
    lines.push(
      `Tokens: ${summary.totalTokens.input} in / ${summary.totalTokens.output} out`,
    );
  }

  if (showCorrelation && summary.correlation) {
    const parts: string[] = [];
    if (summary.correlation.correlationId) {
      parts.push(`correlationId=${summary.correlation.correlationId}`);
    }
    if (summary.correlation.requestId) {
      parts.push(`requestId=${summary.correlation.requestId}`);
    }
    if (summary.correlation.decisionId) {
      parts.push(`decisionId=${summary.correlation.decisionId}`);
    }
    if (summary.correlation.groupId) {
      parts.push(`groupId=${summary.correlation.groupId}`);
    }
    if (parts.length > 0) {
      lines.push(`Correlation: ${parts.join(", ")}`);
    }
  }

  lines.push(`Outcome: ${outcomeLine(summary)}`);

  if (summary.longestStep && summary.totalSteps > 0) {
    lines.push(
      `Slowest: ${summary.longestStep.name} (${formatDuration(summary.longestStep.durationMs)}, ${summary.longestStep.type})`,
    );
  }

  if (summary.maxDepth > 0) {
    lines.push(`Max depth: ${summary.maxDepth}`);
  }

  return lines.join("\n");
}
