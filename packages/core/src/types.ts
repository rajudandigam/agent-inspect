/**
 * Discriminator for what kind of work a {@link Step} represents.
 * `"decision"` captures agent branching/choices; other values cover runs, LLM calls, tools, and user-defined steps.
 */
export type StepType =
  | "run"
  | "llm"
  | "tool"
  | "decision"
  | "logic"
  | "state"
  | "custom";

/** Lifecycle state of a single {@link Step}. */
export type StepStatus = "running" | "success" | "error";

/** Lifecycle state of an entire {@link Run}. */
export type RunStatus = "running" | "success" | "error";

/** Structured error attached to a run or step when status is `"error"`. */
export interface ErrorInfo {
  message: string;
  stack?: string;
}

/**
 * Optional token counts for a step (e.g. LLM usage).
 * Reserved for future roadmap; MVP does not compute or persist token usage.
 */
export interface TokenMetadata {
  input?: number;
  output?: number;
}

/** Arbitrary structured fields for a step; safe extensions use string keys. */
export interface StepMetadata {
  model?: string;
  toolName?: string;
  tokens?: TokenMetadata;
  retryCount?: number;
  [key: string]: unknown;
}

/**
 * One traced agent run (root of an execution tree).
 * MVP intentionally omits `input` / `output` on the run to limit PII, secrets, and serialization risk.
 */
export interface Run {
  id: string;
  name: string;
  status: RunStatus;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  error?: ErrorInfo;
  metadata?: Record<string, unknown>;
}

/**
 * One node in the execution tree under a {@link Run}.
 * MVP intentionally omits `input` / `output`; capture/redaction may come in a later version.
 */
export interface Step {
  id: string;
  runId: string;
  parentId?: string;
  name: string;
  type: StepType;
  status: StepStatus;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  error?: ErrorInfo;
  metadata?: StepMetadata;
}

/** Version of the JSONL trace line schema consumed by AgentInspect tooling. */
export type TraceSchemaVersion = "0.1";

/** Fields shared by every persisted trace event line. */
export interface TraceEventBase {
  schemaVersion: TraceSchemaVersion;
  event: string;
  timestamp: number;
}

/** Emitted when a run begins. */
export interface RunStartedEvent extends TraceEventBase {
  event: "run_started";
  runId: string;
  name: string;
  startTime: number;
  metadata?: Record<string, unknown>;
}

/** Emitted when a run finishes successfully or with an error. */
export interface RunCompletedEvent extends TraceEventBase {
  event: "run_completed";
  runId: string;
  status: "success" | "error";
  endTime: number;
  durationMs: number;
  error?: ErrorInfo;
}

/** Emitted when a step begins (including nested steps under `parentId`). */
export interface StepStartedEvent extends TraceEventBase {
  event: "step_started";
  runId: string;
  stepId: string;
  parentId?: string;
  name: string;
  type: StepType;
  startTime: number;
  metadata?: StepMetadata;
}

/**
 * Emitted when a step finishes (success or failure).
 * Failures use `status: "error"` and optional {@link ErrorInfo}; there is no separate `step_failed` event in MVP.
 */
export interface StepCompletedEvent extends TraceEventBase {
  event: "step_completed";
  runId: string;
  stepId: string;
  status: "success" | "error";
  endTime: number;
  durationMs: number;
  error?: ErrorInfo;
}

/** Discriminated union of all MVP trace events written as JSONL lines. */
export type TraceEvent =
  | RunStartedEvent
  | RunCompletedEvent
  | StepStartedEvent
  | StepCompletedEvent;

/** Options for `inspectRun()` (implemented in a later step). */
export interface InspectRunOptions {
  traceDir?: string;
  silent?: boolean;
  metadata?: Record<string, unknown>;
}

/** Options passed when opening a logical step (implemented in a later step). */
export interface StepOptions {
  type?: StepType;
  metadata?: StepMetadata;
}

/** Options for `observe()` — same surface as {@link InspectRunOptions} in MVP. */
export type ObserveOptions = InspectRunOptions;

/**
 * Resolved settings for the active run while tracing is enabled.
 * Populated by runtime code in a later step; defined here for `context.ts`.
 */
export interface ExecutionContext {
  runId: string;
  runName: string;
  traceDir: string;
  silent: boolean;
  metadata?: Record<string, unknown>;
}

/** Stack position of the step currently executing (used by future context tracking). */
export interface ActiveStepContext {
  stepId: string;
  parentId?: string;
  depth: number;
}

const STEP_TYPES: readonly StepType[] = [
  "run",
  "llm",
  "tool",
  "decision",
  "logic",
  "state",
  "custom",
] as const;

const STEP_STATUSES: readonly StepStatus[] = [
  "running",
  "success",
  "error",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Returns true if `value` is one of the MVP {@link StepType} literals. */
export function isStepType(value: unknown): value is StepType {
  return (
    typeof value === "string" &&
    (STEP_TYPES as readonly string[]).includes(value)
  );
}

/** Returns true if `value` is one of the MVP {@link StepStatus} literals. */
export function isStepStatus(value: unknown): value is StepStatus {
  return (
    typeof value === "string" &&
    (STEP_STATUSES as readonly string[]).includes(value)
  );
}

/**
 * Narrowing guard for a {@link TraceEvent} object with required MVP fields.
 * Does not deeply validate optional `metadata` shapes.
 */
export function isTraceEvent(value: unknown): value is TraceEvent {
  if (!isRecord(value)) return false;
  if (value.schemaVersion !== "0.1") return false;
  if (typeof value.timestamp !== "number") return false;
  if (typeof value.event !== "string") return false;

  switch (value.event) {
    case "run_started": {
      return (
        typeof value.runId === "string" &&
        typeof value.name === "string" &&
        typeof value.startTime === "number"
      );
    }
    case "run_completed": {
      return (
        typeof value.runId === "string" &&
        (value.status === "success" || value.status === "error") &&
        typeof value.endTime === "number" &&
        typeof value.durationMs === "number"
      );
    }
    case "step_started": {
      return (
        typeof value.runId === "string" &&
        typeof value.stepId === "string" &&
        typeof value.name === "string" &&
        isStepType(value.type) &&
        typeof value.startTime === "number"
      );
    }
    case "step_completed": {
      return (
        typeof value.runId === "string" &&
        typeof value.stepId === "string" &&
        (value.status === "success" || value.status === "error") &&
        typeof value.endTime === "number" &&
        typeof value.durationMs === "number"
      );
    }
    default:
      return false;
  }
}
