import { bindTelemetryIntegration } from "ai";
import type {
  OnFinishEvent,
  OnStartEvent,
  OnStepFinishEvent,
  OnStepStartEvent,
  OnToolCallFinishEvent,
  OnToolCallStartEvent,
  TelemetryIntegration,
} from "ai";
import type {
  RedactionProfile,
} from "agent-inspect/advanced";
import type {
  PersistedInspectEvent,
  PersistedInspectError,
  PersistedTokenUsage,
} from "agent-inspect/persisted";
import { fileWriter } from "agent-inspect/writers";
import type { TraceWriter, TraceWriterStats } from "agent-inspect/writers";

/**
 * Experimental capture mode for the AI SDK adapter.
 *
 * @experimental This package is part of the v1.7 adapter train.
 */
export type AgentInspectAiSdkCaptureMode = "metadata-only" | "preview";

/**
 * Options for the experimental AI SDK telemetry integration.
 *
 * @experimental Callers must keep AI SDK telemetry configured with
 * `recordInputs: false` and `recordOutputs: false`.
 */
export interface AgentInspectAiSdkOptions {
  /**
   * Explicit local writer for future runtime integration.
   */
  writer?: TraceWriter;

  /**
   * Convenience local trace directory for future writer-owned persistence.
   */
  traceDir?: string;

  /**
   * Optional run name used by future lifecycle mapping.
   */
  runName?: string;

  /**
   * Capture policy. Defaults to metadata-only.
   *
   * @experimental `preview` is currently rejected with diagnostics and falls
   * back to metadata-only until bounded free-text preview capture is implemented.
   */
  capture?: AgentInspectAiSdkCaptureMode;

  /**
   * Redaction profile for future preview capture.
   *
   * @experimental Currently diagnostic-only because the adapter persists
   * metadata summaries and does not write raw preview content.
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

export interface AgentInspectAiSdkDiagnostics {
  writeFailures: number;
  lifecycleWarnings: number;
  flushFailures: number;
  closeFailures: number;
  lastError?: string;
  lastWarning?: string;
}

export interface AgentInspectAiSdkIntegration extends TelemetryIntegration {
  getDiagnostics(): AgentInspectAiSdkDiagnostics;
  getWriterStats(): TraceWriterStats | undefined;
  flush(): Promise<void>;
  close(): Promise<void>;
}

type AiSdkModelInfo = {
  provider?: string;
  modelId?: string;
};

type AiSdkUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  cachedInputTokens?: number;
};

interface ActiveStep {
  eventId: string;
  parentId: string;
  startedAt: string;
}

interface ActiveTool {
  eventId: string;
  parentId: string;
  startedAt: string;
  toolName: string;
}

interface ActiveRun {
  runId: string;
  eventId: string;
  name: string;
  startedAt: string;
  model?: AiSdkModelInfo;
  steps: Map<number, ActiveStep>;
  tools: Map<string, ActiveTool>;
}

const AI_SDK_SOURCE = {
  type: "ai-sdk",
  name: "@agent-inspect/ai-sdk",
  version: "experimental",
} as const;

function nowIso(): string {
  return new Date().toISOString();
}

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function normalizeError(error: unknown): string {
  if (error instanceof Error && error.message.trim() !== "") {
    return error.message;
  }
  if (typeof error === "string" && error.trim() !== "") {
    return error;
  }
  return "Unknown AI SDK integration error";
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

function summarizeError(error: unknown): PersistedInspectError {
  if (error instanceof Error) {
    return {
      name: error.name || "Error",
      message: error.message,
    };
  }
  if (typeof error === "string") {
    return {
      message: error,
    };
  }
  return {
    message: "Unknown AI SDK tool error",
  };
}

function summarizeModel(model: AiSdkModelInfo | undefined): Record<string, unknown> {
  return {
    provider: model?.provider,
    modelId: model?.modelId,
  };
}

function summarizeUsage(usage: AiSdkUsage | undefined): PersistedTokenUsage | undefined {
  if (!usage) return undefined;

  const tokenUsage: PersistedTokenUsage = {};
  if (typeof usage.inputTokens === "number") tokenUsage.input = usage.inputTokens;
  if (typeof usage.outputTokens === "number") tokenUsage.output = usage.outputTokens;
  if (typeof usage.totalTokens === "number") tokenUsage.total = usage.totalTokens;
  if (typeof usage.cachedInputTokens === "number") tokenUsage.cached = usage.cachedInputTokens;

  return Object.keys(tokenUsage).length > 0 ? tokenUsage : undefined;
}

function summarizeFinishReason(
  finishReason: unknown,
): { finishReason?: string; rawFinishReason?: string } {
  if (typeof finishReason === "string") {
    return { finishReason };
  }
  if (typeof finishReason !== "object" || finishReason === null) {
    return {};
  }

  const value = finishReason as { unified?: unknown; raw?: unknown };
  return {
    finishReason: typeof value.unified === "string" ? value.unified : undefined,
    rawFinishReason: typeof value.raw === "string" ? value.raw : undefined,
  };
}

class AgentInspectAiSdkTelemetryIntegration {
  private readonly writer: TraceWriter | undefined;
  private readonly requestedCapture: AgentInspectAiSdkCaptureMode;
  private readonly effectiveCapture: "metadata-only" = "metadata-only";
  private readonly diagnostics: AgentInspectAiSdkDiagnostics = {
    writeFailures: 0,
    lifecycleWarnings: 0,
    flushFailures: 0,
    closeFailures: 0,
  };
  private activeRun: ActiveRun | undefined;
  private suspendedReason: string | undefined;

  constructor(private readonly options: AgentInspectAiSdkOptions) {
    this.requestedCapture = options.capture ?? "metadata-only";
    this.writer = options.writer ?? (options.traceDir ? fileWriter({ dir: options.traceDir }) : undefined);
    this.recordCaptureOptionWarnings();
  }

  getDiagnostics(): AgentInspectAiSdkDiagnostics {
    return { ...this.diagnostics };
  }

  async onStart(event: OnStartEvent): Promise<void> {
    await this.handleLifecycle("onStart", async () => {
      if (this.activeRun || this.suspendedReason) {
        this.activeRun = undefined;
        this.suspendedReason =
          "Overlapping AI SDK generation ignored; create one agentInspect() integration per concurrent generation.";
        this.recordLifecycleWarning(this.suspendedReason);
        return;
      }

      const startedAt = nowIso();
      const runId = createId("ai_sdk_run");
      const eventId = createId("event");
      const name =
        this.options.runName ??
        event.functionId ??
        event.model.modelId ??
        "ai-sdk-generation";

      this.activeRun = {
        runId,
        eventId,
        name,
        startedAt,
        model: event.model,
        steps: new Map(),
        tools: new Map(),
      };

      await this.write({
        schemaVersion: "0.2",
        eventId,
        runId,
        kind: "RUN",
        name,
        status: "running",
        timestamp: startedAt,
        startedAt,
        confidence: "explicit",
        source: AI_SDK_SOURCE,
        attributes: {
          legacyEvent: "run_started",
          ...summarizeModel(event.model),
          functionId: event.functionId,
          capture: this.effectiveCapture,
          requestedCapture:
            this.requestedCapture === this.effectiveCapture
              ? undefined
              : this.requestedCapture,
          previewCaptureSupported:
            this.requestedCapture === "preview" ? false : undefined,
          redactionProfile: this.options.redactionProfile,
          maxPreviewChars: normalizeMaxPreviewChars(this.options.maxPreviewChars),
          recordInputsRequired: false,
          recordOutputsRequired: false,
          toolCount: countRecordKeys(event.tools),
          hasPrompt: event.prompt !== undefined,
          hasMessages: event.messages !== undefined,
          metadataKeyCount: countRecordKeys(event.metadata),
        },
      });
    });
  }

  async onStepStart(event: OnStepStartEvent): Promise<void> {
    await this.handleLifecycle("onStepStart", async () => {
      const run = this.getActiveRun("onStepStart");
      if (!run) return;
      const startedAt = nowIso();
      const stepEventId = createId("event");
      run.steps.set(event.stepNumber, {
        eventId: stepEventId,
        parentId: run.eventId,
        startedAt,
      });

      await this.write({
        schemaVersion: "0.2",
        eventId: stepEventId,
        runId: run.runId,
        parentId: run.eventId,
        kind: "LLM",
        name: `ai-sdk-step-${event.stepNumber}`,
        status: "running",
        timestamp: startedAt,
        startedAt,
        confidence: "explicit",
        source: AI_SDK_SOURCE,
        attributes: {
          legacyEvent: "step_started",
          stepId: stepEventId,
          ...summarizeModel(event.model),
          functionId: event.functionId,
          stepNumber: event.stepNumber,
          priorStepCount: event.steps.length,
          activeToolCount: event.activeTools?.length,
          toolCount: countRecordKeys(event.tools),
          messageCount: event.messages.length,
          metadataKeyCount: countRecordKeys(event.metadata),
        },
      });
    });
  }

  async onStepFinish(event: OnStepFinishEvent): Promise<void> {
    await this.handleLifecycle("onStepFinish", async () => {
      const run = this.getActiveRun("onStepFinish");
      if (!run) return;
      const endedAt = nowIso();
      const activeStep = run.steps.get(event.stepNumber);
      if (!activeStep) {
        this.recordLifecycleWarning(
          `onStepFinish ignored because step ${event.stepNumber} has no matching start callback.`,
        );
        return;
      }

      await this.write({
        schemaVersion: "0.2",
        eventId: activeStep.eventId,
        runId: run.runId,
        parentId: activeStep.parentId,
        kind: "LLM",
        name: `ai-sdk-step-${event.stepNumber}`,
        status: "ok",
        timestamp: endedAt,
        startedAt: activeStep.startedAt,
        endedAt,
        durationMs: durationMs(activeStep.startedAt, endedAt),
        confidence: "explicit",
        source: AI_SDK_SOURCE,
        attributes: {
          legacyEvent: "step_completed",
          stepId: activeStep.eventId,
          ...summarizeModel(event.model),
          functionId: event.functionId,
          stepNumber: event.stepNumber,
          ...summarizeFinishReason(event.finishReason),
          warningCount: event.warnings?.length ?? 0,
          contentPartCount: event.content.length,
          toolCallCount: event.toolCalls.length,
          toolResultCount: event.toolResults.length,
          responseId: event.response.id,
          responseModelId: event.response.modelId,
          responseTimestamp: event.response.timestamp?.toISOString(),
          metadataKeyCount: countRecordKeys(event.metadata),
        },
        tokenUsage: summarizeUsage(event.usage),
        outputSummary: {
          contentPartCount: event.content.length,
          textLength: event.text.length,
          reasoningPartCount: event.reasoning.length,
          fileCount: event.files.length,
          sourceCount: event.sources.length,
        },
      });
    });
  }

  async onToolCallStart(event: OnToolCallStartEvent): Promise<void> {
    await this.handleLifecycle("onToolCallStart", async () => {
      const run = this.getActiveRun("onToolCallStart");
      if (!run) return;
      const startedAt = nowIso();
      const eventId = createId("event");
      const toolCall = event.toolCall;
      const step = event.stepNumber === undefined ? undefined : run.steps.get(event.stepNumber);
      const parentId = step?.eventId ?? run.eventId;
      if (event.stepNumber === undefined || !step) {
        this.recordLifecycleWarning(
          "onToolCallStart attached tool to run because the AI SDK callback did not expose a matching active step.",
        );
      }
      run.tools.set(toolCall.toolCallId, {
        eventId,
        parentId,
        startedAt,
        toolName: toolCall.toolName,
      });

      await this.write({
        schemaVersion: "0.2",
        eventId,
        runId: run.runId,
        parentId,
        kind: "TOOL",
        name: toolCall.toolName,
        status: "running",
        timestamp: startedAt,
        startedAt,
        confidence: "explicit",
        source: AI_SDK_SOURCE,
        attributes: {
          legacyEvent: "step_started",
          stepId: eventId,
          ...summarizeModel(event.model),
          functionId: event.functionId,
          stepNumber: event.stepNumber,
          toolCallId: toolCall.toolCallId,
          toolName: toolCall.toolName,
          dynamic: toolCall.dynamic === true,
          invalid: toolCall.invalid === true,
          providerExecuted: toolCall.providerExecuted === true,
          messageCount: event.messages.length,
          metadataKeyCount: countRecordKeys(event.metadata),
          providerMetadataKeyCount: countRecordKeys(toolCall.providerMetadata),
          toolMetadataKeyCount: countRecordKeys(toolCall.toolMetadata),
        },
        inputSummary: summarizeUnknown(toolCall.input),
        error: toolCall.invalid ? summarizeError(toolCall.error) : undefined,
      });
    });
  }

  async onToolCallFinish(event: OnToolCallFinishEvent): Promise<void> {
    await this.handleLifecycle("onToolCallFinish", async () => {
      const run = this.getActiveRun("onToolCallFinish");
      if (!run) return;
      const endedAt = nowIso();
      const toolCall = event.toolCall;
      const activeTool = run.tools.get(toolCall.toolCallId);
      if (!activeTool) {
        this.recordLifecycleWarning(
          `onToolCallFinish ignored because tool call ${toolCall.toolCallId} has no matching start callback.`,
        );
        return;
      }

      await this.write({
        schemaVersion: "0.2",
        eventId: activeTool.eventId,
        runId: run.runId,
        parentId: activeTool.parentId,
        kind: "TOOL",
        name: activeTool.toolName,
        status: event.success ? "ok" : "error",
        timestamp: endedAt,
        startedAt: activeTool.startedAt,
        endedAt,
        durationMs: event.durationMs,
        confidence: "explicit",
        source: AI_SDK_SOURCE,
        attributes: {
          legacyEvent: "step_completed",
          stepId: activeTool.eventId,
          ...summarizeModel(event.model),
          functionId: event.functionId,
          stepNumber: event.stepNumber,
          toolCallId: toolCall.toolCallId,
          toolName: toolCall.toolName,
          dynamic: toolCall.dynamic === true,
          invalid: toolCall.invalid === true,
          providerExecuted: toolCall.providerExecuted === true,
          messageCount: event.messages.length,
          metadataKeyCount: countRecordKeys(event.metadata),
          providerMetadataKeyCount: countRecordKeys(toolCall.providerMetadata),
          toolMetadataKeyCount: countRecordKeys(toolCall.toolMetadata),
        },
        outputSummary: event.success ? summarizeUnknown(event.output) : undefined,
        error: event.success ? undefined : summarizeError(event.error),
      });
    });
  }

  async onFinish(event: OnFinishEvent): Promise<void> {
    await this.handleLifecycle("onFinish", async () => {
      if (this.suspendedReason) {
        this.suspendedReason = undefined;
        return;
      }
      const run = this.getActiveRun("onFinish");
      if (!run) return;
      const endedAt = nowIso();

      await this.write({
        schemaVersion: "0.2",
        eventId: run.eventId,
        runId: run.runId,
        kind: "RUN",
        name: run.name,
        status: "ok",
        timestamp: endedAt,
        startedAt: run.startedAt,
        endedAt,
        durationMs: durationMs(run.startedAt, endedAt),
        confidence: "explicit",
        source: AI_SDK_SOURCE,
        attributes: {
          legacyEvent: "run_completed",
          ...summarizeModel(event.model ?? run.model),
          functionId: event.functionId,
          ...summarizeFinishReason(event.finishReason),
          stepCount: event.steps.length,
          warningCount: event.warnings?.length ?? 0,
          toolCallCount: event.toolCalls.length,
          toolResultCount: event.toolResults.length,
          metadataKeyCount: countRecordKeys(event.metadata),
        },
        tokenUsage: summarizeUsage(event.totalUsage),
        outputSummary: {
          contentPartCount: event.content.length,
          textLength: event.text.length,
          reasoningPartCount: event.reasoning.length,
          fileCount: event.files.length,
          sourceCount: event.sources.length,
        },
      });

      this.activeRun = undefined;
    });
  }

  getWriterStats(): TraceWriterStats | undefined {
    return this.writer?.getStats?.();
  }

  async flush(): Promise<void> {
    try {
      await this.writer?.flush?.();
    } catch (error) {
      this.diagnostics.flushFailures += 1;
      this.diagnostics.lastError = normalizeError(error);
    }
  }

  async close(): Promise<void> {
    try {
      await this.writer?.close?.();
    } catch (error) {
      this.diagnostics.closeFailures += 1;
      this.diagnostics.lastError = normalizeError(error);
    } finally {
      this.activeRun = undefined;
      this.suspendedReason = undefined;
    }
  }

  private getActiveRun(callbackName: string): ActiveRun | undefined {
    if (this.suspendedReason) {
      this.recordLifecycleWarning(
        `${callbackName} ignored while integration is suspended: ${this.suspendedReason}`,
      );
      return undefined;
    }
    if (this.activeRun) return this.activeRun;

    this.recordLifecycleWarning(
      `${callbackName} ignored because no active AI SDK generation was started.`,
    );
    return undefined;
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
        `AI SDK preview capture is not supported yet; falling back to metadata-only capture. Unsupported options: ${previewOnlyOptions.join(", ")}.`,
      );
      return;
    }

    if (previewOnlyOptions.length > 0) {
      this.recordLifecycleWarning(
        `AI SDK preview-only options have no effect in metadata-only capture: ${previewOnlyOptions.join(", ")}.`,
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
 * Create an AgentInspect telemetry integration for the Vercel AI SDK.
 *
 * @experimental The adapter maps metadata-only generation, LLM step, and tool
 * lifecycle events. Keep AI SDK telemetry configured with
 * `recordInputs: false` and `recordOutputs: false`.
 */
export function agentInspect(
  options: AgentInspectAiSdkOptions = {},
): AgentInspectAiSdkIntegration {
  const integration = new AgentInspectAiSdkTelemetryIntegration(options);
  return {
    ...bindTelemetryIntegration(integration),
    getDiagnostics: () => integration.getDiagnostics(),
    getWriterStats: () => integration.getWriterStats(),
    flush: () => integration.flush(),
    close: () => integration.close(),
  };
}
