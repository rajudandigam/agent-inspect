import type {
  Span,
  SpanData,
  SpanError,
  Trace,
  TracingProcessor,
} from "@openai/agents";
import type {
  PersistedInspectError,
  PersistedInspectEvent,
  PersistedTokenUsage,
  RedactionProfile,
} from "agent-inspect";
import { fileWriter } from "agent-inspect/writers";
import type { TraceWriter, TraceWriterStats } from "agent-inspect/writers";

/**
 * Experimental capture mode for the OpenAI Agents JS adapter.
 *
 * @experimental This package is part of the v1.8 adapter train. `preview` is
 * currently rejected with diagnostics and falls back to metadata-only capture.
 */
export type AgentInspectOpenAiAgentsCaptureMode = "metadata-only" | "preview";

/**
 * Options for the experimental OpenAI Agents JS tracing processor.
 *
 * @experimental Install processors with `setTraceProcessors([...])`
 * replacement behavior for local-only tracing. Do not use `addTraceProcessor()`
 * as the default path because it preserves the SDK's default exporter.
 */
export interface AgentInspectOpenAiAgentsOptions {
  /**
   * Explicit local writer for persisted v0.2 AgentInspect events.
   */
  writer?: TraceWriter;

  /**
   * Convenience local trace directory for writer-owned persistence.
   */
  traceDir?: string;

  /**
   * Optional workflow name overriding the SDK trace name.
   */
  workflowName?: string;

  /**
   * Capture policy. Defaults to metadata-only.
   *
   * @experimental `preview` is not implemented yet; requesting it records a
   * diagnostic warning and keeps metadata-only persistence.
   */
  capture?: AgentInspectOpenAiAgentsCaptureMode;

  /**
   * Redaction profile for future preview capture.
   *
   * @experimental Currently diagnostic-only because the processor persists
   * metadata summaries and never writes raw span content by default.
   */
  redactionProfile?: RedactionProfile;

  /**
   * Bounds future preview capture.
   *
   * @experimental Currently diagnostic-only because `preview` falls back to
   * metadata-only capture.
   */
  maxPreviewChars?: number;
}

export interface AgentInspectOpenAiAgentsDiagnostics {
  writeFailures: number;
  lifecycleWarnings: number;
  flushFailures: number;
  shutdownFailures: number;
  lastError?: string;
  lastWarning?: string;
  runtimeMappingImplemented: true;
}

export interface AgentInspectOpenAiAgentsProcessor extends TracingProcessor {
  /**
   * Documents the only safe default install mode for this adapter.
   */
  readonly installMode: "setTraceProcessors";

  /**
   * This processor never installs itself globally and performs no network I/O.
   */
  readonly localOnly: true;

  getDiagnostics(): AgentInspectOpenAiAgentsDiagnostics;
  getWriterStats(): TraceWriterStats | undefined;
}

type ActiveTrace = {
  eventId: string;
  startedAt: string;
  name: string;
};

type ActiveSpan = {
  eventId: string;
  runId: string;
  parentId?: string;
  startedAt: string;
  name: string;
  kind: PersistedInspectEvent["kind"];
};

type SpanDataType = SpanData["type"];

const OPENAI_AGENTS_SOURCE = {
  type: "adapter",
  name: "@agent-inspect/openai-agents",
  version: "experimental",
} as const;

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeError(error: unknown): string {
  if (error instanceof Error && error.message.trim() !== "") {
    return error.message;
  }
  if (typeof error === "string" && error.trim() !== "") {
    return error;
  }
  return "Unknown OpenAI Agents processor error";
}

function durationMs(startedAt: string, endedAt: string): number | undefined {
  const started = Date.parse(startedAt);
  const ended = Date.parse(endedAt);
  if (!Number.isFinite(started) || !Number.isFinite(ended)) return undefined;
  return Math.max(0, ended - started);
}

function countRecordKeys(value: unknown): number | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }
  return Object.keys(value).length;
}

function normalizeMaxPreviewChars(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return undefined;
  }
  return Math.floor(value);
}

function summarizeUnknown(value: unknown): Record<string, unknown> {
  if (value === null) return { type: "null" };
  if (Array.isArray(value)) return { type: "array", itemCount: value.length };

  if (typeof value === "object") {
    return { type: "object", keyCount: countRecordKeys(value) ?? 0 };
  }
  if (typeof value === "string") {
    return { type: "string", length: value.length };
  }
  const valueType = typeof value;
  if (valueType === "number" || valueType === "boolean" || valueType === "bigint") {
    return { type: valueType };
  }
  if (valueType === "undefined") return { type: "undefined" };
  return { type: "unknown" };
}

function summarizeOptionalUnknown(value: unknown): Record<string, unknown> | undefined {
  return value === undefined ? undefined : summarizeUnknown(value);
}

function summarizeError(error: SpanError | null | undefined): PersistedInspectError | undefined {
  if (!error?.message) return undefined;
  return { message: error.message };
}

function summarizeUsage(usage: unknown): PersistedTokenUsage | undefined {
  if (typeof usage !== "object" || usage === null || Array.isArray(usage)) {
    return undefined;
  }

  const record = usage as Record<string, unknown>;
  const tokenUsage: PersistedTokenUsage = {};
  if (typeof record.input_tokens === "number" && Number.isFinite(record.input_tokens)) {
    tokenUsage.input = record.input_tokens;
  }
  if (typeof record.output_tokens === "number" && Number.isFinite(record.output_tokens)) {
    tokenUsage.output = record.output_tokens;
  }
  if (tokenUsage.input !== undefined || tokenUsage.output !== undefined) {
    tokenUsage.total = (tokenUsage.input ?? 0) + (tokenUsage.output ?? 0);
  }

  const details = record.details;
  if (typeof details === "object" && details !== null && !Array.isArray(details)) {
    const detailRecord = details as Record<string, unknown>;
    const cached = detailRecord.cached_tokens ?? detailRecord.cached_input_tokens;
    if (typeof cached === "number" && Number.isFinite(cached)) {
      tokenUsage.cached = cached;
    }
  }

  return Object.keys(tokenUsage).length > 0 ? tokenUsage : undefined;
}

function spanKind(type: SpanDataType): PersistedInspectEvent["kind"] {
  switch (type) {
    case "agent":
      return "AGENT";
    case "generation":
    case "response":
    case "transcription":
    case "speech":
      return "LLM";
    case "function":
    case "mcp_tools":
      return "TOOL";
    case "handoff":
    case "guardrail":
      return "DECISION";
    case "custom":
    case "speech_group":
      return "LOGIC";
    default:
      return "LOGIC";
  }
}

function spanName(data: SpanData): string {
  switch (data.type) {
    case "agent":
    case "function":
    case "custom":
    case "guardrail":
      return data.name;
    case "generation":
      return data.model ? `generation:${data.model}` : "generation";
    case "response":
      return data.response_id ? `response:${data.response_id}` : "response";
    case "handoff":
      return data.to_agent ? `handoff:${data.to_agent}` : "handoff";
    case "mcp_tools":
      return data.server ? `mcp-tools:${data.server}` : "mcp-tools";
    case "transcription":
      return data.model ? `transcription:${data.model}` : "transcription";
    case "speech":
      return data.model ? `speech:${data.model}` : "speech";
    case "speech_group":
      return "speech-group";
    default:
      return "openai-agents-span";
  }
}

function commonSpanAttributes(span: Span<SpanData>): Record<string, unknown> {
  return {
    legacyEvent: "step_started",
    stepId: span.spanId,
    stepType: mapSpanTypeToStepType(span.spanData.type),
    spanType: span.spanData.type,
    traceId: span.traceId,
    spanId: span.spanId,
    parentSpanId: span.parentId ?? undefined,
    traceMetadataKeyCount: countRecordKeys(span.traceMetadata),
  };
}

function specificSpanAttributes(data: SpanData): Record<string, unknown> {
  switch (data.type) {
    case "agent":
      return {
        agentName: data.name,
        handoffCount: data.handoffs?.length ?? 0,
        handoffNames: data.handoffs,
        toolCount: data.tools?.length ?? 0,
        toolNames: data.tools,
        outputType: data.output_type,
      };
    case "function":
      return {
        toolName: data.name,
        hasInput: data.input !== undefined,
        hasOutput: data.output !== undefined,
        inputSummary: summarizeUnknown(data.input),
        outputSummary: summarizeUnknown(data.output),
        mcpDataSummary: summarizeOptionalUnknown(data.mcp_data),
      };
    case "generation":
      return {
        model: data.model,
        modelConfigKeyCount: countRecordKeys(data.model_config),
        inputSummary: summarizeOptionalUnknown(data.input),
        outputSummary: summarizeOptionalUnknown(data.output),
        usageDetailsKeyCount: countRecordKeys(data.usage?.details),
      };
    case "response":
      return {
        responseId: data.response_id,
        inputSummary: summarizeOptionalUnknown(data._input),
        responseSummary: summarizeOptionalUnknown(data._response),
      };
    case "handoff":
      return {
        fromAgent: data.from_agent,
        toAgent: data.to_agent,
      };
    case "custom":
      return {
        customName: data.name,
        dataSummary: summarizeUnknown(data.data),
      };
    case "guardrail":
      return {
        guardrailName: data.name,
        triggered: data.triggered,
      };
    case "mcp_tools":
      return {
        server: data.server,
        toolCount: data.result?.length ?? 0,
        toolNames: data.result,
      };
    case "transcription":
      return {
        model: data.model,
        inputFormat: data.input.format,
        inputSummary: summarizeUnknown(data.input.data),
        outputSummary: summarizeOptionalUnknown(data.output),
        modelConfigKeyCount: countRecordKeys(data.model_config),
      };
    case "speech":
      return {
        model: data.model,
        inputSummary: summarizeOptionalUnknown(data.input),
        outputFormat: data.output.format,
        outputSummary: summarizeUnknown(data.output.data),
        modelConfigKeyCount: countRecordKeys(data.model_config),
      };
    case "speech_group":
      return {
        inputSummary: summarizeOptionalUnknown(data.input),
      };
    default:
      return {};
  }
}

function mapSpanTypeToStepType(type: SpanDataType): string {
  switch (type) {
    case "generation":
    case "response":
    case "transcription":
    case "speech":
      return "llm";
    case "function":
    case "mcp_tools":
      return "tool";
    case "handoff":
    case "guardrail":
      return "decision";
    case "agent":
      return "logic";
    case "custom":
    case "speech_group":
      return "custom";
    default:
      return "logic";
  }
}

function spanInputSummary(data: SpanData): unknown {
  switch (data.type) {
    case "generation":
      return summarizeOptionalUnknown(data.input);
    case "function":
      return summarizeUnknown(data.input);
    case "response":
      return summarizeOptionalUnknown(data._input);
    case "custom":
      return summarizeUnknown(data.data);
    case "transcription":
      return { format: data.input.format, ...summarizeUnknown(data.input.data) };
    case "speech":
    case "speech_group":
      return summarizeOptionalUnknown(data.input);
    default:
      return undefined;
  }
}

function spanOutputSummary(data: SpanData): unknown {
  switch (data.type) {
    case "generation":
      return summarizeOptionalUnknown(data.output);
    case "function":
      return summarizeUnknown(data.output);
    case "response":
      return summarizeOptionalUnknown(data._response);
    case "guardrail":
      return { triggered: data.triggered };
    case "mcp_tools":
      return { toolCount: data.result?.length ?? 0 };
    case "transcription":
      return summarizeOptionalUnknown(data.output);
    case "speech":
      return { format: data.output.format, ...summarizeUnknown(data.output.data) };
    default:
      return undefined;
  }
}

function traceEventId(traceId: string): string {
  return `openai_agents_trace:${traceId}`;
}

function spanEventId(spanId: string): string {
  return `openai_agents_span:${spanId}`;
}

class AgentInspectOpenAiAgentsTracingProcessor implements AgentInspectOpenAiAgentsProcessor {
  readonly installMode = "setTraceProcessors" as const;
  readonly localOnly = true as const;

  private readonly writer: TraceWriter | undefined;
  private readonly requestedCapture: AgentInspectOpenAiAgentsCaptureMode;
  private readonly effectiveCapture: "metadata-only" = "metadata-only";
  private readonly diagnostics: AgentInspectOpenAiAgentsDiagnostics = {
    writeFailures: 0,
    lifecycleWarnings: 0,
    flushFailures: 0,
    shutdownFailures: 0,
    runtimeMappingImplemented: true,
  };
  private readonly activeTraces = new Map<string, ActiveTrace>();
  private readonly activeSpans = new Map<string, ActiveSpan>();
  private closed = false;

  constructor(private readonly options: AgentInspectOpenAiAgentsOptions) {
    this.requestedCapture = options.capture ?? "metadata-only";
    this.writer = options.writer ?? (options.traceDir ? fileWriter({ dir: options.traceDir }) : undefined);
    for (const key of [
      "options",
      "writer",
      "requestedCapture",
      "effectiveCapture",
      "diagnostics",
      "activeTraces",
      "activeSpans",
      "closed",
    ] as const) {
      Object.defineProperty(this, key, { enumerable: false });
    }
    this.recordCaptureOptionWarnings();
  }

  start(): void {
    // Local writer-backed processor has no export loop to start.
  }

  async onTraceStart(trace: Trace): Promise<void> {
    await this.handleLifecycle("onTraceStart", async () => {
      if (this.closed) {
        this.recordLifecycleWarning("onTraceStart ignored because processor is shut down.");
        return;
      }

      const startedAt = nowIso();
      const name = this.options.workflowName ?? trace.name ?? "openai-agents-run";
      const eventId = traceEventId(trace.traceId);
      this.activeTraces.set(trace.traceId, { eventId, startedAt, name });

      await this.write({
        schemaVersion: "0.2",
        eventId,
        runId: trace.traceId,
        kind: "RUN",
        name,
        status: "running",
        timestamp: startedAt,
        startedAt,
        confidence: "explicit",
        source: OPENAI_AGENTS_SOURCE,
        attributes: {
          legacyEvent: "run_started",
          installMode: this.installMode,
          capture: this.effectiveCapture,
          requestedCapture:
            this.requestedCapture === this.effectiveCapture
              ? undefined
              : this.requestedCapture,
          previewCaptureSupported:
            this.requestedCapture === "preview" ? false : undefined,
          redactionProfile: this.options.redactionProfile,
          maxPreviewChars: normalizeMaxPreviewChars(this.options.maxPreviewChars),
          groupId: trace.groupId ?? undefined,
          metadataKeyCount: countRecordKeys(trace.metadata),
        },
        trace: {
          traceId: trace.traceId,
        },
      });
    });
  }

  async onTraceEnd(trace: Trace): Promise<void> {
    await this.handleLifecycle("onTraceEnd", async () => {
      if (this.closed) {
        this.recordLifecycleWarning("onTraceEnd ignored because processor is shut down.");
        return;
      }

      const active = this.activeTraces.get(trace.traceId);
      if (!active) {
        this.recordLifecycleWarning(
          `onTraceEnd ignored because trace ${trace.traceId} has no matching start callback.`,
        );
        return;
      }

      const endedAt = nowIso();
      await this.write({
        schemaVersion: "0.2",
        eventId: active.eventId,
        runId: trace.traceId,
        kind: "RUN",
        name: active.name,
        status: "ok",
        timestamp: endedAt,
        startedAt: active.startedAt,
        endedAt,
        durationMs: durationMs(active.startedAt, endedAt),
        confidence: "explicit",
        source: OPENAI_AGENTS_SOURCE,
        attributes: {
          legacyEvent: "run_completed",
          installMode: this.installMode,
          groupId: trace.groupId ?? undefined,
          metadataKeyCount: countRecordKeys(trace.metadata),
        },
        trace: {
          traceId: trace.traceId,
        },
      });
      this.activeTraces.delete(trace.traceId);
    });
  }

  async onSpanStart(span: Span<SpanData>): Promise<void> {
    await this.handleLifecycle("onSpanStart", async () => {
      if (this.closed) {
        this.recordLifecycleWarning("onSpanStart ignored because processor is shut down.");
        return;
      }

      const startedAt = span.startedAt ?? nowIso();
      const eventId = spanEventId(span.spanId);
      const parentId = this.resolveParentEventId(span);
      const kind = spanKind(span.spanData.type);
      const name = spanName(span.spanData);
      this.activeSpans.set(span.spanId, {
        eventId,
        runId: span.traceId,
        parentId,
        startedAt,
        name,
        kind,
      });

      await this.write({
        schemaVersion: "0.2",
        eventId,
        runId: span.traceId,
        parentId,
        kind,
        name,
        status: "running",
        timestamp: startedAt,
        startedAt,
        confidence: "explicit",
        source: OPENAI_AGENTS_SOURCE,
        attributes: {
          ...commonSpanAttributes(span),
          ...specificSpanAttributes(span.spanData),
        },
        inputSummary: spanInputSummary(span.spanData),
        tokenUsage: summarizeUsage(
          span.spanData.type === "generation" ? span.spanData.usage : undefined,
        ),
        trace: {
          traceId: span.traceId,
          spanId: span.spanId,
          parentSpanId: span.parentId ?? undefined,
        },
      });
    });
  }

  async onSpanEnd(span: Span<SpanData>): Promise<void> {
    await this.handleLifecycle("onSpanEnd", async () => {
      if (this.closed) {
        this.recordLifecycleWarning("onSpanEnd ignored because processor is shut down.");
        return;
      }

      const active = this.activeSpans.get(span.spanId);
      if (!active) {
        this.recordLifecycleWarning(
          `onSpanEnd ignored because span ${span.spanId} has no matching start callback.`,
        );
        return;
      }

      const endedAt = span.endedAt ?? nowIso();
      const error = summarizeError(span.error);
      await this.write({
        schemaVersion: "0.2",
        eventId: active.eventId,
        runId: active.runId,
        parentId: active.parentId,
        kind: active.kind,
        name: active.name,
        status: error ? "error" : "ok",
        timestamp: endedAt,
        startedAt: active.startedAt,
        endedAt,
        durationMs: durationMs(active.startedAt, endedAt),
        confidence: "explicit",
        source: OPENAI_AGENTS_SOURCE,
        attributes: {
          ...commonSpanAttributes(span),
          ...specificSpanAttributes(span.spanData),
          legacyEvent: "step_completed",
          errorDataSummary: summarizeOptionalUnknown(span.error?.data),
        },
        inputSummary: spanInputSummary(span.spanData),
        outputSummary: spanOutputSummary(span.spanData),
        error,
        tokenUsage: summarizeUsage(
          span.spanData.type === "generation" ? span.spanData.usage : undefined,
        ),
        trace: {
          traceId: span.traceId,
          spanId: span.spanId,
          parentSpanId: span.parentId ?? undefined,
        },
      });
      this.activeSpans.delete(span.spanId);
    });
  }

  async forceFlush(): Promise<void> {
    try {
      await this.writer?.flush?.();
    } catch (error) {
      this.diagnostics.flushFailures += 1;
      this.diagnostics.lastError = normalizeError(error);
    }
  }

  async shutdown(_timeout?: number): Promise<void> {
    if (this.closed) return;
    try {
      await this.writer?.close?.();
    } catch (error) {
      this.diagnostics.shutdownFailures += 1;
      this.diagnostics.lastError = normalizeError(error);
    } finally {
      this.closed = true;
      this.activeTraces.clear();
      this.activeSpans.clear();
    }
  }

  getDiagnostics(): AgentInspectOpenAiAgentsDiagnostics {
    return { ...this.diagnostics };
  }

  getWriterStats(): TraceWriterStats | undefined {
    return this.writer?.getStats?.();
  }

  private resolveParentEventId(span: Span<SpanData>): string | undefined {
    if (span.parentId) return spanEventId(span.parentId);
    return this.activeTraces.get(span.traceId)?.eventId;
  }

  private async handleLifecycle(
    callbackName: string,
    run: () => Promise<void>,
  ): Promise<void> {
    try {
      await run();
    } catch (error) {
      this.recordLifecycleWarning(`${callbackName}: ${normalizeError(error)}`);
    }
  }

  private recordLifecycleWarning(message: string): void {
    this.diagnostics.lifecycleWarnings += 1;
    this.diagnostics.lastWarning = message;
  }

  private recordCaptureOptionWarnings(): void {
    const previewOnlyOptions: string[] = [];
    if (this.requestedCapture === "preview") previewOnlyOptions.push("capture");
    if (this.options.redactionProfile !== undefined) previewOnlyOptions.push("redactionProfile");
    if (this.options.maxPreviewChars !== undefined) previewOnlyOptions.push("maxPreviewChars");

    if (this.requestedCapture === "preview") {
      this.recordLifecycleWarning(
        `OpenAI Agents preview capture is not supported yet; falling back to metadata-only capture. Unsupported options: ${previewOnlyOptions.join(", ")}.`,
      );
      return;
    }

    if (previewOnlyOptions.length > 0) {
      this.recordLifecycleWarning(
        `OpenAI Agents preview-only options have no effect in metadata-only capture: ${previewOnlyOptions.join(", ")}.`,
      );
    }
  }

  private async write(event: PersistedInspectEvent): Promise<void> {
    if (!this.writer) return;

    try {
      await this.writer.write(event);
    } catch (error) {
      this.diagnostics.writeFailures += 1;
      this.diagnostics.lastError = normalizeError(error);
    }
  }
}

/**
 * Create an AgentInspect OpenAI Agents JS tracing processor.
 *
 * @experimental Install the returned processor explicitly with replacement
 * semantics:
 *
 * ```ts
 * setTraceProcessors([agentInspectProcessor(options)]);
 * ```
 *
 * The processor does not call `setTraceProcessors()`, `addTraceProcessor()`,
 * OpenAI exporters, or network APIs on import or construction.
 */
export function agentInspectProcessor(
  options: AgentInspectOpenAiAgentsOptions = {},
): AgentInspectOpenAiAgentsProcessor {
  return new AgentInspectOpenAiAgentsTracingProcessor(options);
}
