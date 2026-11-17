import {
  createRunId,
  createStepId,
  getCurrentRunId,
  getTraceDirFromContext,
  hasActiveContext,
  initializeTraceFile,
  prepareMetadataForDisk,
  resolveTraceDir,
  resolveTraceSafetyOptions,
  type AttributionConfidence,
  type InspectKind,
  type RedactionProfile,
  type StepMetadata,
  type StepType,
} from "agent-inspect/advanced";
import type {
  PersistedInspectEvent,
  PersistedTokenUsage,
} from "agent-inspect/persisted";
import type { RedactionRule } from "agent-inspect/logs";
import { fileWriter } from "agent-inspect/writers";
import type { TraceWriter } from "agent-inspect/writers";
import {
  beginCallbackRun,
  bumpCompletionGeneration,
  canScheduleFinalize,
  createInvocationState,
  endCallbackRun,
  markEnvelopeStarted,
  markFinalized,
  noteTerminalError,
  resetInvocationState,
  type AdapterInvocationState,
} from "./invocation-state.js";
import {
  applyAmbiguousScaffoldingDiagnostic,
  applyParentResolutionMetadata,
  applySelfParentCaptureInvariant,
  rejectSelfParentResolution,
  resolveParentRelationship,
  type ParentResolution,
} from "./parent-reconciliation.js";

export interface LangChainTracePersistenceOptions {
  runName?: string;
  traceDir?: string;
  runId?: string;
  redact?: RedactionRule[];
  silent?: boolean;
  maxPreviewChars?: number;
  /** Named redaction profile applied to persisted metadata and previews. */
  redactionProfile?: RedactionProfile;
}

/** Options for explicit envelope finalization (serverless / unusual callback shapes). */
export interface FinalizeOptions {
  status?: "success" | "error";
  errorMessage?: string;
  endTime?: number;
}

/** Bounded persistence diagnostics (no absolute paths / customer payloads). */
export interface AdapterPersistenceDiagnostics {
  readonly lateEventCount: number;
  readonly activeRunCount: number;
  readonly endedRunCount: number;
  readonly pendingRelationshipCount: number;
  readonly knownRelationshipCount: number;
  readonly syntheticGroupCount: number;
  readonly selfParentRejectedCount: number;
  readonly ambiguousRelationshipCount: number;
  readonly envelopeStarted: boolean;
  readonly finalized: boolean;
  readonly completionGeneration: number;
  readonly hasTerminalError: boolean;
}

const LANGCHAIN_SOURCE = {
  type: "adapter",
  name: "@agent-inspect/langchain",
  version: "experimental",
} as const;

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

function msToIso(ms: number): string {
  if (typeof ms !== "number" || !Number.isFinite(ms)) {
    return new Date(0).toISOString();
  }
  return new Date(ms).toISOString();
}

function asTokenUsage(value: unknown): PersistedTokenUsage | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }
  const record = value as Record<string, unknown>;
  const out: PersistedTokenUsage = {};
  for (const key of [
    "input",
    "output",
    "total",
    "cached",
    "cacheWrite",
    "reasoning",
  ] as const) {
    const n = record[key];
    if (typeof n === "number" && Number.isFinite(n)) {
      out[key] = n;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function stripHelperKeys(
  attrs: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (key === "tokens" || key === "name" || key === "kind") continue;
    out[key] = value;
  }
  return out;
}

/**
 * PersistedInspectEvent.confidence only accepts AttributionConfidence
 * (`explicit` | `correlated` | `heuristic` | `unknown`). LangChain parent
 * vocabulary (`synthetic` / `unresolved`) stays in attributes.metadata.
 */
function confidenceFromMetadata(
  metadata: Record<string, unknown>,
): AttributionConfidence {
  const value = metadata.confidence;
  if (value === "explicit" || value === "correlated") return value;
  if (value === "synthetic" || value === "inferred") return "heuristic";
  if (value === "unresolved") return "unknown";
  if (value === "heuristic" || value === "unknown") return value;
  return "explicit";
}

function toPersistedStatus(
  status: "success" | "error",
): "ok" | "error" {
  return status === "error" ? "error" : "ok";
}

/**
 * Maps LangChain callback lifecycle to PersistedInspectEvent schemaVersion "0.2"
 * (same shape as `@agent-inspect/ai-sdk`). Completion rows carry top-level
 * `tokenUsage` so stream and non-stream LLM calls persist usage without changing
 * global/manual v0.1 contracts.
 *
 * One callback session creates one standalone run; inside inspectRun, steps append
 * to the active run.
 *
 * Standalone envelope completion is driven by {@link AdapterInvocationState}
 * (activeRuns / completionGeneration / finalized) — not by empty parentRunId heuristics.
 */
export class LangChainTracePersistence {
  readonly #traceDir: string;
  #runId: string;
  readonly #runName: string;
  readonly #standalone: boolean;
  readonly #silent: boolean;
  readonly #safety: ReturnType<typeof resolveTraceSafetyOptions>;
  readonly #writer: TraceWriter;
  readonly #lifecycle: AdapterInvocationState;
  readonly #lcToStepId = new Map<string, string>();
  /** lcRunId → display name from the matching start (for completion rows). */
  readonly #lcToStepName = new Map<string, string>();
  /** `${field}\0${value}` → stepId, or null when ambiguous. */
  readonly #langGraphIndex = new Map<string, string | null>();
  /** Semantic / display label → stepId, or null when ambiguous. */
  readonly #semanticLabelIndex = new Map<string, string | null>();
  /** Semantic label → synthetic step id (created once ≥2 siblings share the label). */
  readonly #syntheticByLabel = new Map<string, string>();
  /** Count of unresolved semantic-parent children seen per label (this invocation). */
  readonly #semanticParentCounts = new Map<string, number>();
  #lateEventCount = 0;
  #selfParentRejectedCount = 0;
  #ambiguousRelationshipCount = 0;

  constructor(options: LangChainTracePersistenceOptions = {}) {
    const inContext = hasActiveContext();
    this.#standalone = !inContext;
    this.#silent = options.silent ?? false;
    this.#traceDir = inContext
      ? (getTraceDirFromContext() ?? resolveTraceDir({ dir: options.traceDir }))
      : resolveTraceDir({ dir: options.traceDir });
    const contextRunId = inContext ? getCurrentRunId() : undefined;
    this.#runId = contextRunId ?? options.runId ?? createRunId();
    this.#runName = options.runName ?? "langchain-agent";
    this.#safety = resolveTraceSafetyOptions({
      redact: options.redact ? { rules: options.redact } : true,
      maxPreviewLength: options.maxPreviewChars,
      ...(options.redactionProfile
        ? { redactionProfile: options.redactionProfile }
        : {}),
    });
    this.#writer = fileWriter({ dir: this.#traceDir });
    this.#lifecycle = createInvocationState(this.#runId);
  }

  get runId(): string {
    return this.#runId;
  }

  get traceDir(): string {
    return this.#traceDir;
  }

  /** @internal Test / diagnostics access to per-invocation lifecycle. */
  get lifecycle(): Readonly<AdapterInvocationState> {
    return this.#lifecycle;
  }

  /** Count of end/start events ignored after finalize (diagnostics). */
  get lateEventCount(): number {
    return this.#lateEventCount;
  }

  /** Bounded adapter diagnostics for CLI/MCP summaries (no filesystem paths). */
  getDiagnostics(): AdapterPersistenceDiagnostics {
    return {
      lateEventCount: this.#lateEventCount,
      activeRunCount: this.#lifecycle.activeRuns.size,
      endedRunCount: this.#lifecycle.endedRuns.size,
      pendingRelationshipCount: this.#lifecycle.pendingRelationships.length,
      knownRelationshipCount: this.#lifecycle.knownRelationships.size,
      syntheticGroupCount: this.#syntheticByLabel.size,
      selfParentRejectedCount: this.#selfParentRejectedCount,
      ambiguousRelationshipCount: this.#ambiguousRelationshipCount,
      envelopeStarted: this.#lifecycle.envelopeStarted,
      finalized: this.#lifecycle.finalized,
      completionGeneration: this.#lifecycle.completionGeneration,
      hasTerminalError: Boolean(this.#lifecycle.terminalError),
    };
  }

  #parentIdForPersist(
    stepId: string,
    resolution: ParentResolution,
    metadata: Record<string, unknown>,
    originalParentRunId?: string,
  ): string | undefined {
    const guarded = applySelfParentCaptureInvariant(
      stepId,
      resolution.parentStepId,
      metadata,
      originalParentRunId ?? resolution.unresolvedParentRunId,
    );
    if (guarded.rejected) {
      this.#selfParentRejectedCount += 1;
    } else if (applyAmbiguousScaffoldingDiagnostic(resolution, metadata)) {
      this.#ambiguousRelationshipCount += 1;
    }
    return guarded.parentStepId;
  }

  /**
   * Start a fresh envelope after a prior invocation finalized (callback reuse).
   * Allocates a new run id unless still nested in an inspectRun context.
   */
  beginNewInvocation(): void {
    if (hasActiveContext()) {
      const ctxId = getCurrentRunId();
      if (ctxId) {
        this.#runId = ctxId;
        resetInvocationState(this.#lifecycle, this.#runId);
        this.#clearStepIndexes();
        this.#lateEventCount = 0;
        this.#selfParentRejectedCount = 0;
        this.#ambiguousRelationshipCount = 0;
        return;
      }
    }
    this.#runId = createRunId();
    resetInvocationState(this.#lifecycle, this.#runId);
    this.#clearStepIndexes();
    this.#lateEventCount = 0;
    this.#selfParentRejectedCount = 0;
    this.#ambiguousRelationshipCount = 0;
  }

  reset(): void {
    resetInvocationState(this.#lifecycle);
    this.#clearStepIndexes();
    this.#lateEventCount = 0;
    this.#selfParentRejectedCount = 0;
    this.#ambiguousRelationshipCount = 0;
  }

  #clearStepIndexes(): void {
    this.#lcToStepId.clear();
    this.#lcToStepName.clear();
    this.#langGraphIndex.clear();
    this.#semanticLabelIndex.clear();
    this.#syntheticByLabel.clear();
    this.#semanticParentCounts.clear();
  }

  #registerUnique(
    index: Map<string, string | null>,
    key: string,
    stepId: string,
  ): void {
    if (!index.has(key)) {
      index.set(key, stepId);
      return;
    }
    if (index.get(key) !== stepId) {
      index.set(key, null);
    }
  }

  #langGraphIndexKey(field: string, value: string): string {
    return `${field}\0${value}`;
  }

  #registerStepIndexes(
    stepId: string,
    name: string,
    attributes: Record<string, unknown>,
  ): void {
    const labels = new Set<string>([name]);
    const stripped = name.replace(/^(chain|tool|llm|retriever|agent):/, "");
    if (stripped) labels.add(stripped);
    for (const label of labels) {
      this.#registerUnique(this.#semanticLabelIndex, label, stepId);
    }

    const lg = attributes.langGraph;
    if (typeof lg === "object" && lg !== null && !Array.isArray(lg)) {
      const record = lg as Record<string, unknown>;
      for (const field of [
        "taskId",
        "nodeId",
        "nodeName",
        "checkpointNamespace",
      ] as const) {
        const raw = record[field];
        if (typeof raw === "string" && raw.trim()) {
          this.#registerUnique(
            this.#langGraphIndex,
            this.#langGraphIndexKey(field, raw),
            stepId,
          );
        }
      }
    }
  }

  #resolveParent(
    parentLcRunId: string | undefined,
    attributes: Record<string, unknown>,
    excludeStepId?: string,
  ): ParentResolution {
    const resolution = resolveParentRelationship(
      { parentLcRunId, attributes },
      {
        exactStepByLcRunId: (lcRunId) => this.#lcToStepId.get(lcRunId),
        uniqueStepByLangGraphKey: (key, value) => {
          const hit = this.#langGraphIndex.get(this.#langGraphIndexKey(key, value));
          return hit === null || hit === undefined ? undefined : hit;
        },
        uniqueStepBySemanticLabel: (label) => {
          const hit = this.#semanticLabelIndex.get(label);
          return hit === null || hit === undefined ? undefined : hit;
        },
      },
      excludeStepId ? { excludeStepId } : {},
    );
    return excludeStepId
      ? rejectSelfParentResolution(resolution, excludeStepId, parentLcRunId)
      : resolution;
  }

  /**
   * When ≥2 steps share the same unresolved semantic parent label, emit one
   * synthetic grouping node and attach this (and later) siblings under it.
   * The first sibling remains unresolved (append-only JSONL cannot rewrite it).
   */
  async #maybeAttachSyntheticGroup(
    resolution: ParentResolution,
    startTime: number,
  ): Promise<ParentResolution> {
    const label = resolution.semanticParentLabel;
    if (
      resolution.parentMapping !== "unresolved" ||
      !label ||
      resolution.parentStepId
    ) {
      return resolution;
    }

    const existing = this.#syntheticByLabel.get(label);
    if (existing) {
      return {
        parentStepId: existing,
        confidence: "synthetic",
        parentMapping: "synthetic-group",
        semanticParentLabel: label,
        unresolvedParentRunId: label,
      };
    }

    const nextCount = (this.#semanticParentCounts.get(label) ?? 0) + 1;
    this.#semanticParentCounts.set(label, nextCount);
    if (nextCount < 2) {
      return resolution;
    }

    const syntheticStepId = createStepId();
    this.#syntheticByLabel.set(label, syntheticStepId);
    const metadata: StepMetadata = {
      adapter: "langchain",
      confidence: "synthetic",
      synthetic: true,
      parentMapping: "synthetic-group",
      parentConfidence: "synthetic",
      semanticParentLabel: label,
      unresolvedParentRunId: label,
    };
    const startedAt = msToIso(startTime);
    await this.#write({
      schemaVersion: "0.2",
      eventId: syntheticStepId,
      runId: this.#runId,
      kind: "LOGIC",
      name: `synthetic:${label}`,
      status: "running",
      timestamp: startedAt,
      startedAt,
      confidence: "heuristic",
      source: LANGCHAIN_SOURCE,
      attributes: {
        legacyEvent: "step_started",
        stepId: syntheticStepId,
        stepType: "logic",
        metadata,
      },
    });

    return {
      parentStepId: syntheticStepId,
      confidence: "synthetic",
      parentMapping: "synthetic-group",
      semanticParentLabel: label,
      unresolvedParentRunId: label,
    };
  }

  /** Rotate when a prior standalone invocation already finalized. */
  #prepareForStart(): void {
    if (this.#standalone && this.#lifecycle.finalized) {
      this.beginNewInvocation();
    }
  }

  /**
   * @deprecated Root-ID heuristics are no longer used for envelope completion.
   * Retained as a no-op for call-site compatibility during the v6.8 train.
   */
  noteRoot(_lcRunId: string, _parentRunId?: string): void {
    // Intentionally empty — completion uses activeRuns lifecycle state.
  }

  resolveParentId(lcParentRunId?: string): string | undefined {
    if (!lcParentRunId) return undefined;
    return this.#lcToStepId.get(lcParentRunId);
  }

  #buildStepAttributes(
    stepId: string,
    kind: InspectKind,
    legacyEvent: "step_started" | "step_completed",
    metadata: Record<string, unknown>,
  ): Record<string, unknown> {
    const cleaned = stripHelperKeys(metadata);
    const attributes: Record<string, unknown> = {
      legacyEvent,
      stepId,
      stepType: kindToStepType(kind),
      metadata: cleaned,
    };
    if (typeof cleaned.model === "string" && cleaned.model.trim()) {
      attributes.model = cleaned.model;
    }
    return attributes;
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
      this.#prepareForStart();
      const stepId = createStepId();
      // Resolve parent before registering this child in any lookup index (N-4).
      const resolution = await this.#maybeAttachSyntheticGroup(
        this.#resolveParent(params.lcParentRunId, params.attributes, stepId),
        params.startTime,
      );

      beginCallbackRun(this.#lifecycle, {
        lcRunId: params.lcRunId,
        parentLcRunId: params.lcParentRunId,
        startedAt: params.startTime,
        kind: params.kind,
        stepId,
      });

      if (this.#standalone && !this.#lifecycle.envelopeStarted) {
        await this.#ensureRunStarted(params.startTime, params.attributes);
      }

      const metadata = toStepMetadata(params.attributes);
      applyParentResolutionMetadata(metadata, resolution);
      const parentId = this.#parentIdForPersist(
        stepId,
        resolution,
        metadata,
        params.lcParentRunId,
      );

      const startedAt = msToIso(params.startTime);
      const event: PersistedInspectEvent = {
        schemaVersion: "0.2",
        eventId: stepId,
        runId: this.#runId,
        ...(parentId ? { parentId } : {}),
        kind: params.kind,
        name: params.name,
        status: "running",
        timestamp: startedAt,
        startedAt,
        confidence: confidenceFromMetadata(metadata),
        source: LANGCHAIN_SOURCE,
        attributes: this.#buildStepAttributes(
          stepId,
          params.kind,
          "step_started",
          metadata,
        ),
      };

      // Exact run-id map after parent resolve so end events can correlate; semantic /
      // LangGraph indexes wait until after persist so the child cannot parent itself.
      this.#lcToStepId.set(params.lcRunId, stepId);
      this.#lcToStepName.set(params.lcRunId, params.name);
      await this.#write(event);
      this.#registerStepIndexes(stepId, params.name, params.attributes);
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
      if (
        this.#lifecycle.finalized &&
        !this.#lifecycle.activeRuns.has(params.lcRunId) &&
        !this.#lcToStepId.has(params.lcRunId)
      ) {
        this.#lateEventCount += 1;
        return;
      }

      let stepId = this.#lcToStepId.get(params.lcRunId);
      let stepKind: InspectKind =
        (params.completionAttributes?.kind as InspectKind | undefined) ?? "LOGIC";
      let stepName =
        typeof params.completionAttributes?.name === "string"
          ? params.completionAttributes.name
          : this.#lcToStepName.get(params.lcRunId);

      if (!stepId && params.completionAttributes) {
        if (this.#lifecycle.finalized) {
          this.#lateEventCount += 1;
          return;
        }
        stepId = createStepId();
        const synthName = String(params.completionAttributes.name ?? "llm:llm");
        stepName = synthName;
        stepKind =
          (params.completionAttributes.kind as InspectKind | undefined) ?? "LLM";
        const startTime = params.endTime - (params.durationMs ?? 0);
        const resolution = await this.#maybeAttachSyntheticGroup(
          this.#resolveParent(
            params.lcParentRunId,
            params.completionAttributes,
            stepId,
          ),
          startTime,
        );
        beginCallbackRun(this.#lifecycle, {
          lcRunId: params.lcRunId,
          parentLcRunId: params.lcParentRunId,
          startedAt: startTime,
          kind: stepKind,
          stepId,
        });
        const metadata = toStepMetadata(
          stripHelperKeys(params.completionAttributes),
        );
        applyParentResolutionMetadata(metadata, resolution);
        const parentId = this.#parentIdForPersist(
          stepId,
          resolution,
          metadata,
          params.lcParentRunId,
        );
        const startedAt = msToIso(startTime);
        const started: PersistedInspectEvent = {
          schemaVersion: "0.2",
          eventId: stepId,
          runId: this.#runId,
          ...(parentId ? { parentId } : {}),
          kind: stepKind,
          name: synthName,
          status: "running",
          timestamp: startedAt,
          startedAt,
          confidence: confidenceFromMetadata(metadata),
          source: LANGCHAIN_SOURCE,
          attributes: this.#buildStepAttributes(
            stepId,
            stepKind,
            "step_started",
            metadata,
          ),
        };
        if (this.#standalone && !this.#lifecycle.envelopeStarted) {
          await this.#ensureRunStarted(startTime, params.completionAttributes);
        }
        this.#lcToStepId.set(params.lcRunId, stepId);
        this.#lcToStepName.set(params.lcRunId, synthName);
        await this.#write(started);
        this.#registerStepIndexes(stepId, synthName, params.completionAttributes);
      }
      if (!stepId) return;

      const active = this.#lifecycle.activeRuns.get(params.lcRunId);
      if (active?.kind === "LLM" || active?.kind === "TOOL" || active?.kind === "DECISION" || active?.kind === "LOGIC" || active?.kind === "RUN" || active?.kind === "OUTCOME") {
        stepKind = active.kind;
      }

      const durationMs =
        typeof params.durationMs === "number" && Number.isFinite(params.durationMs)
          ? Math.max(0, Math.floor(params.durationMs))
          : Math.max(
              0,
              params.endTime - (this.#lifecycle.runStartTime ?? params.endTime),
            );

      const completionMeta = params.completionAttributes
        ? toStepMetadata(stripHelperKeys(params.completionAttributes))
        : { adapter: "langchain", confidence: "explicit" as const };
      const tokenUsage = asTokenUsage(params.completionAttributes?.tokens);
      const endedAt = msToIso(params.endTime);
      const startedAtMs =
        active?.startedAt ?? params.endTime - durationMs;
      const completed: PersistedInspectEvent = {
        schemaVersion: "0.2",
        eventId: createStepId(),
        runId: this.#runId,
        kind: stepKind,
        name: stepName ?? stepId,
        status: toPersistedStatus(params.status),
        timestamp: endedAt,
        startedAt: msToIso(startedAtMs),
        endedAt,
        durationMs,
        confidence: confidenceFromMetadata(completionMeta),
        source: LANGCHAIN_SOURCE,
        attributes: this.#buildStepAttributes(
          stepId,
          stepKind,
          "step_completed",
          completionMeta,
        ),
        ...(tokenUsage ? { tokenUsage } : {}),
        ...(params.status === "error" && params.errorMessage
          ? { error: { message: params.errorMessage } }
          : {}),
      };

      await this.#write(completed);
      this.#lcToStepName.delete(params.lcRunId);

      if (params.status === "error") {
        noteTerminalError(
          this.#lifecycle,
          params.errorMessage ?? "adapter step error",
        );
      }
      endCallbackRun(this.#lifecycle, params.lcRunId);
      await this.#scheduleStandaloneFinalization(params.endTime);
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
      this.#prepareForStart();
      const stepId = createStepId();
      const resolution = await this.#maybeAttachSyntheticGroup(
        this.#resolveParent(params.lcParentRunId, params.attributes, stepId),
        params.timestamp,
      );
      beginCallbackRun(this.#lifecycle, {
        lcRunId: params.lcRunId,
        parentLcRunId: params.lcParentRunId,
        startedAt: params.timestamp,
        kind: params.kind,
        stepId,
      });

      if (this.#standalone && !this.#lifecycle.envelopeStarted) {
        await this.#ensureRunStarted(params.timestamp, params.attributes);
      }

      const metadata = toStepMetadata(params.attributes);
      applyParentResolutionMetadata(metadata, resolution);
      const parentId = this.#parentIdForPersist(
        stepId,
        resolution,
        metadata,
        params.lcParentRunId,
      );

      const at = msToIso(params.timestamp);
      const started: PersistedInspectEvent = {
        schemaVersion: "0.2",
        eventId: stepId,
        runId: this.#runId,
        ...(parentId ? { parentId } : {}),
        kind: params.kind,
        name: params.name,
        status: "running",
        timestamp: at,
        startedAt: at,
        confidence: confidenceFromMetadata(metadata),
        source: LANGCHAIN_SOURCE,
        attributes: this.#buildStepAttributes(
          stepId,
          params.kind,
          "step_started",
          metadata,
        ),
      };
      this.#lcToStepId.set(params.lcRunId, stepId);
      this.#lcToStepName.set(params.lcRunId, params.name);
      await this.#write(started);
      this.#registerStepIndexes(stepId, params.name, params.attributes);

      const completed: PersistedInspectEvent = {
        schemaVersion: "0.2",
        eventId: createStepId(),
        runId: this.#runId,
        kind: params.kind,
        name: params.name,
        status: toPersistedStatus(params.status),
        timestamp: at,
        startedAt: at,
        endedAt: at,
        durationMs: 0,
        confidence: confidenceFromMetadata(metadata),
        source: LANGCHAIN_SOURCE,
        attributes: this.#buildStepAttributes(
          stepId,
          params.kind,
          "step_completed",
          metadata,
        ),
        ...(params.status === "error" && params.errorMessage
          ? { error: { message: params.errorMessage } }
          : {}),
      };
      await this.#write(completed);

      if (params.status === "error") {
        noteTerminalError(
          this.#lifecycle,
          params.errorMessage ?? "adapter step error",
        );
      }
      endCallbackRun(this.#lifecycle, params.lcRunId);
      await this.#scheduleStandaloneFinalization(params.timestamp);
    } catch (err) {
      this.#warn(err);
    }
  }

  /**
   * Drain deferred microtask finalization. Idempotent; never throws to callers.
   * @experimental
   */
  async flush(): Promise<void> {
    try {
      await Promise.resolve();
      await Promise.resolve();
      await this.#writer.flush?.();
    } catch (err) {
      this.#warn(err);
    }
  }

  /**
   * Force-complete the standalone envelope when safe/started.
   * Works even if active callback runs remain (unusual framework shapes / serverless).
   * Idempotent; never throws to callers.
   * @experimental
   */
  async finalize(options: FinalizeOptions = {}): Promise<boolean> {
    try {
      if (!this.#standalone) return false;
      if (this.#lifecycle.finalized) return false;
      if (!this.#lifecycle.envelopeStarted) return false;

      // Cancel any in-flight deferred finalize so we do not double-write.
      bumpCompletionGeneration(this.#lifecycle);

      const status =
        options.status ??
        (this.#lifecycle.terminalError ? "error" : "success");
      if (status === "error") {
        noteTerminalError(
          this.#lifecycle,
          options.errorMessage ??
            this.#lifecycle.terminalError?.message ??
            "adapter finalize error",
        );
      }

      await this.#ensureRunCompleted(
        options.endTime ?? Date.now(),
        status,
        status === "error"
          ? (options.errorMessage ?? this.#lifecycle.terminalError?.message)
          : undefined,
      );
      return this.#lifecycle.finalized;
    } catch (err) {
      this.#warn(err);
      return false;
    }
  }

  /**
   * Flush + finalize. Idempotent; never throws to callers.
   * @experimental
   */
  async close(): Promise<void> {
    try {
      await this.flush();
      await this.finalize();
      await this.#writer.close?.();
    } catch (err) {
      this.#warn(err);
    }
  }

  /**
   * When the last active LangChain callback ends, yield one microtask so a
   * same-turn sibling start can cancel finalization, then write run_completed
   * before the callback promise settles. Unresolved external parents do not
   * block the envelope.
   */
  async #scheduleStandaloneFinalization(endTime: number): Promise<void> {
    if (!this.#standalone || !canScheduleFinalize(this.#lifecycle)) return;

    const generation = this.#lifecycle.completionGeneration;
    await Promise.resolve();
    if (this.#lifecycle.completionGeneration !== generation) return;
    if (!this.#standalone || !canScheduleFinalize(this.#lifecycle)) return;

    const status = this.#lifecycle.terminalError ? "error" : "success";
    await this.#ensureRunCompleted(
      endTime,
      status,
      status === "error" ? this.#lifecycle.terminalError?.message : undefined,
    );
  }

  async #ensureRunStarted(
    startTime: number,
    attrs: Record<string, unknown>,
  ): Promise<void> {
    if (!markEnvelopeStarted(this.#lifecycle, startTime)) return;

    await initializeTraceFile(this.#runId, this.#traceDir);

    const metadata: Record<string, unknown> = {
      adapter: "langchain",
      confidence: "explicit",
    };
    if (attrs.langchainRunId) metadata.langchainRunId = attrs.langchainRunId;
    if (attrs.adapterRunName) metadata.adapterRunName = attrs.adapterRunName;

    const startedAt = msToIso(startTime);
    await this.#write({
      schemaVersion: "0.2",
      eventId: this.#runId,
      runId: this.#runId,
      kind: "RUN",
      name: this.#runName,
      status: "running",
      timestamp: startedAt,
      startedAt,
      confidence: "explicit",
      source: LANGCHAIN_SOURCE,
      attributes: {
        legacyEvent: "run_started",
        metadata,
      },
    });
  }

  async #ensureRunCompleted(
    endTime: number,
    stepStatus: "success" | "error",
    errorMessage?: string,
  ): Promise<void> {
    if (!markFinalized(this.#lifecycle)) return;

    for (const [, syntheticStepId] of this.#syntheticByLabel) {
      const endedAt = msToIso(endTime);
      const durationMs = Math.max(
        0,
        endTime - (this.#lifecycle.runStartTime ?? endTime),
      );
      await this.#write({
        schemaVersion: "0.2",
        eventId: createStepId(),
        runId: this.#runId,
        kind: "LOGIC",
        name: syntheticStepId,
        status: "ok",
        timestamp: endedAt,
        endedAt,
        durationMs,
        confidence: "heuristic",
        source: LANGCHAIN_SOURCE,
        attributes: {
          legacyEvent: "step_completed",
          stepId: syntheticStepId,
          stepType: "logic",
        },
      });
    }

    const startTime = this.#lifecycle.runStartTime ?? endTime;
    const durationMs = Math.max(0, endTime - startTime);
    const endedAt = msToIso(endTime);
    const runStatus = toPersistedStatus(stepStatus);

    await this.#write({
      schemaVersion: "0.2",
      eventId: createStepId(),
      runId: this.#runId,
      kind: "RUN",
      name: this.#runName,
      status: runStatus,
      timestamp: endedAt,
      startedAt: msToIso(startTime),
      endedAt,
      durationMs,
      confidence: "explicit",
      source: LANGCHAIN_SOURCE,
      attributes: {
        legacyEvent: "run_completed",
      },
      ...(runStatus === "error" && errorMessage
        ? { error: { message: errorMessage } }
        : {}),
    });
  }

  async #write(event: PersistedInspectEvent): Promise<void> {
    // Apply adapter-specific redaction/bounds before the shared writer safety pass.
    const attributes = event.attributes
      ? prepareMetadataForDisk(event.attributes, this.#safety)
      : undefined;
    const prepared: PersistedInspectEvent = {
      ...event,
      ...(attributes ? { attributes } : {}),
    };
    if (!attributes) {
      delete (prepared as { attributes?: unknown }).attributes;
    }
    await this.#writer.write(prepared);
  }

  #warn(err: unknown): void {
    if (!this.#silent) {
      console.error("[agent-inspect:langchain]", err);
    }
  }
}
