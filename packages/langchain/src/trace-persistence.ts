import {
  createRunId,
  createStepId,
  getCurrentRunId,
  getTraceDirFromContext,
  hasActiveContext,
  initializeTraceFile,
  prepareTraceEventForDisk,
  resolveTraceDir,
  resolveTraceSafetyOptions,
  writeTraceEvent,
  type InspectKind,
  type StepMetadata,
  type StepType,
  type TraceEvent,
} from "agent-inspect/advanced";
import type { RedactionRule } from "agent-inspect/logs";

export interface LangChainTracePersistenceOptions {
  runName?: string;
  traceDir?: string;
  runId?: string;
  redact?: RedactionRule[];
  silent?: boolean;
  maxPreviewChars?: number;
}

function kindToStepType(kind: InspectKind): StepType {
  switch (kind) {
    case "LLM":
      return "llm";
    case "TOOL":
      return "tool";
    case "DECISION":
      return "decision";
    default:
      return "logic";
  }
}

function toStepMetadata(attrs: Record<string, unknown>): StepMetadata {
  const out: StepMetadata = {
    adapter: "langchain",
    confidence: "explicit",
  };
  for (const [k, v] of Object.entries(attrs)) {
    out[k] = v;
  }
  return out;
}

/**
 * Maps LangChain callback lifecycle to schemaVersion "0.1" manual JSONL events.
 * One callback session creates one standalone run; inside inspectRun, steps append to the active run.
 */
export class LangChainTracePersistence {
  readonly #traceDir: string;
  readonly #runId: string;
  readonly #runName: string;
  readonly #standalone: boolean;
  readonly #silent: boolean;
  readonly #safety: ReturnType<typeof resolveTraceSafetyOptions>;

  #runStarted = false;
  #runCompleted = false;
  #runStartTime?: number;
  #rootLcRunId?: string;
  readonly #lcToStepId = new Map<string, string>();

  constructor(options: LangChainTracePersistenceOptions = {}) {
    const inContext = hasActiveContext();
    this.#standalone = !inContext;
    this.#silent = options.silent ?? false;
    this.#traceDir = inContext
      ? (getTraceDirFromContext() ?? resolveTraceDir({ dir: options.traceDir }))
      : resolveTraceDir({ dir: options.traceDir });
    this.#runId =
      (inContext ? getCurrentRunId() : undefined) ??
      options.runId ??
      createRunId();
    this.#runName = options.runName ?? "langchain-agent";
    this.#safety = resolveTraceSafetyOptions({
      redact: options.redact ? { rules: options.redact } : true,
      maxPreviewLength: options.maxPreviewChars,
    });
  }

  get runId(): string {
    return this.#runId;
  }

  get traceDir(): string {
    return this.#traceDir;
  }

  reset(): void {
    this.#runStarted = false;
    this.#runCompleted = false;
    this.#runStartTime = undefined;
    this.#rootLcRunId = undefined;
    this.#lcToStepId.clear();
  }

  noteRoot(lcRunId: string, parentRunId?: string): void {
    if (!parentRunId && !this.#rootLcRunId) {
      this.#rootLcRunId = lcRunId;
    }
  }

  resolveParentId(lcParentRunId?: string): string | undefined {
    if (!lcParentRunId) return undefined;
    return this.#lcToStepId.get(lcParentRunId);
  }

  async onStepStart(params: {
    lcRunId: string;
    lcParentRunId?: string;
    name: string;
    kind: InspectKind;
    startTime: number;
    attributes: Record<string, unknown>;
  }): Promise<void> {
    try {
      this.noteRoot(params.lcRunId, params.lcParentRunId);

      if (this.#standalone && !this.#runStarted) {
        await this.#ensureRunStarted(params.startTime, params.attributes);
      }

      const stepId = createStepId();
      this.#lcToStepId.set(params.lcRunId, stepId);
      const parentId = this.resolveParentId(params.lcParentRunId);
      const metadata = toStepMetadata(params.attributes);
      if (params.lcParentRunId && !parentId) {
        metadata.parentMapping = "unresolved";
        metadata.unresolvedParentRunId = params.lcParentRunId;
      }

      const event: TraceEvent = {
        schemaVersion: "0.1",
        event: "step_started",
        timestamp: params.startTime,
        runId: this.#runId,
        stepId,
        ...(parentId ? { parentId } : {}),
        name: params.name,
        type: kindToStepType(params.kind),
        startTime: params.startTime,
        metadata,
      };

      await this.#write(event);
    } catch (err) {
      this.#warn(err);
    }
  }

  async onStepEnd(params: {
    lcRunId: string;
    lcParentRunId?: string;
    endTime: number;
    durationMs?: number;
    status: "success" | "error";
    errorMessage?: string;
    completionAttributes?: Record<string, unknown>;
  }): Promise<void> {
    try {
      let stepId = this.#lcToStepId.get(params.lcRunId);
      if (!stepId && params.completionAttributes) {
        stepId = createStepId();
        this.#lcToStepId.set(params.lcRunId, stepId);
        const parentId = this.resolveParentId(params.lcParentRunId);
        const metadata = toStepMetadata(params.completionAttributes);
        if (params.lcParentRunId && !parentId) {
          metadata.parentMapping = "unresolved";
          metadata.unresolvedParentRunId = params.lcParentRunId;
        }
        const startTime = params.endTime - (params.durationMs ?? 0);
        const started: TraceEvent = {
          schemaVersion: "0.1",
          event: "step_started",
          timestamp: startTime,
          runId: this.#runId,
          stepId,
          ...(parentId ? { parentId } : {}),
          name: String(params.completionAttributes.name ?? "llm:llm"),
          type: kindToStepType(
            (params.completionAttributes.kind as InspectKind | undefined) ?? "LLM",
          ),
          startTime,
          metadata,
        };
        await this.#write(started);
      }
      if (!stepId) return;

      const durationMs =
        typeof params.durationMs === "number" && Number.isFinite(params.durationMs)
          ? Math.max(0, Math.floor(params.durationMs))
          : Math.max(0, params.endTime - (this.#runStartTime ?? params.endTime));

      const event: TraceEvent = {
        schemaVersion: "0.1",
        event: "step_completed",
        timestamp: params.endTime,
        runId: this.#runId,
        stepId,
        status: params.status,
        endTime: params.endTime,
        durationMs,
        ...(params.status === "error" && params.errorMessage
          ? { error: { message: params.errorMessage } }
          : {}),
      };

      await this.#write(event);

      if (
        this.#standalone &&
        !this.#runCompleted &&
        this.#rootLcRunId === params.lcRunId &&
        !params.lcParentRunId
      ) {
        await this.#ensureRunCompleted(
          params.endTime,
          params.status,
          params.errorMessage,
        );
      }
    } catch (err) {
      this.#warn(err);
    }
  }

  /** Point-in-time adapter events (e.g. agent action) — writes start + completed pair. */
  async onInstantStep(params: {
    lcRunId: string;
    lcParentRunId?: string;
    name: string;
    kind: InspectKind;
    timestamp: number;
    attributes: Record<string, unknown>;
    status: "success" | "error";
    errorMessage?: string;
  }): Promise<void> {
    try {
      this.noteRoot(params.lcRunId, params.lcParentRunId);

      if (this.#standalone && !this.#runStarted) {
        await this.#ensureRunStarted(params.timestamp, params.attributes);
      }

      const stepId = createStepId();
      this.#lcToStepId.set(params.lcRunId, stepId);
      const parentId = this.resolveParentId(params.lcParentRunId);
      const metadata = toStepMetadata(params.attributes);
      if (params.lcParentRunId && !parentId) {
        metadata.parentMapping = "unresolved";
        metadata.unresolvedParentRunId = params.lcParentRunId;
      }

      const started: TraceEvent = {
        schemaVersion: "0.1",
        event: "step_started",
        timestamp: params.timestamp,
        runId: this.#runId,
        stepId,
        ...(parentId ? { parentId } : {}),
        name: params.name,
        type: kindToStepType(params.kind),
        startTime: params.timestamp,
        metadata,
      };
      await this.#write(started);

      const completed: TraceEvent = {
        schemaVersion: "0.1",
        event: "step_completed",
        timestamp: params.timestamp,
        runId: this.#runId,
        stepId,
        status: params.status,
        endTime: params.timestamp,
        durationMs: 0,
        ...(params.status === "error" && params.errorMessage
          ? { error: { message: params.errorMessage } }
          : {}),
      };
      await this.#write(completed);
    } catch (err) {
      this.#warn(err);
    }
  }

  async #ensureRunStarted(
    startTime: number,
    attrs: Record<string, unknown>,
  ): Promise<void> {
    if (this.#runStarted) return;
    this.#runStarted = true;
    this.#runStartTime = startTime;

    await initializeTraceFile(this.#runId, this.#traceDir);

    const metadata: Record<string, unknown> = {
      adapter: "langchain",
      confidence: "explicit",
    };
    if (attrs.langchainRunId) metadata.langchainRunId = attrs.langchainRunId;
    if (attrs.adapterRunName) metadata.adapterRunName = attrs.adapterRunName;

    const event: TraceEvent = {
      schemaVersion: "0.1",
      event: "run_started",
      timestamp: startTime,
      runId: this.#runId,
      name: this.#runName,
      startTime,
      metadata,
    };
    await this.#write(event);
  }

  async #ensureRunCompleted(
    endTime: number,
    stepStatus: "success" | "error",
    errorMessage?: string,
  ): Promise<void> {
    if (this.#runCompleted || !this.#runStarted) return;
    this.#runCompleted = true;

    const startTime = this.#runStartTime ?? endTime;
    const durationMs = Math.max(0, endTime - startTime);
    const runStatus = stepStatus === "error" ? "error" : "success";

    const event: TraceEvent = {
      schemaVersion: "0.1",
      event: "run_completed",
      timestamp: endTime,
      runId: this.#runId,
      status: runStatus,
      endTime,
      durationMs,
      ...(runStatus === "error" && errorMessage
        ? { error: { message: errorMessage } }
        : {}),
    };
    await this.#write(event);
  }

  async #write(event: TraceEvent): Promise<void> {
    const safe = prepareTraceEventForDisk(event, this.#safety);
    await writeTraceEvent(safe, this.#traceDir);
  }

  #warn(err: unknown): void {
    if (!this.#silent) {
      console.error("[agent-inspect:langchain]", err);
    }
  }
}
