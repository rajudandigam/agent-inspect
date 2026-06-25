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
  PersistedInspectEvent,
  PersistedInspectError,
  PersistedTokenUsage,
  RedactionProfile,
} from "agent-inspect";
import { fileWriter } from "agent-inspect/writers";
import type { TraceWriter } from "agent-inspect/writers";

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
   * Capture policy. Defaults to metadata-only when runtime mapping lands.
   */
  capture?: AgentInspectAiSdkCaptureMode;

  /**
   * Redaction profile applied before local persistence in future mapping.
   */
  redactionProfile?: RedactionProfile;

  /**
   * Bounds any future preview capture.
   */
  maxPreviewChars?: number;
}

export interface AgentInspectAiSdkDiagnostics {
  writeFailures: number;
  lastError?: string;
}

export interface AgentInspectAiSdkIntegration extends TelemetryIntegration {
  getDiagnostics(): AgentInspectAiSdkDiagnostics;
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
  startedAt: string;
}

interface ActiveTool {
  eventId: string;
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
  private readonly diagnostics: AgentInspectAiSdkDiagnostics = {
    writeFailures: 0,
  };
  private activeRun: ActiveRun | undefined;

  constructor(private readonly options: AgentInspectAiSdkOptions) {
    this.writer = options.writer ?? (options.traceDir ? fileWriter({ dir: options.traceDir }) : undefined);
  }

  getDiagnostics(): AgentInspectAiSdkDiagnostics {
    return { ...this.diagnostics };
  }

  async onStart(event: OnStartEvent): Promise<void> {
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
        ...summarizeModel(event.model),
        functionId: event.functionId,
        capture: this.options.capture ?? "metadata-only",
        recordInputsRequired: false,
        recordOutputsRequired: false,
        toolCount: countRecordKeys(event.tools),
        hasPrompt: event.prompt !== undefined,
        hasMessages: event.messages !== undefined,
        metadataKeyCount: countRecordKeys(event.metadata),
      },
    });
  }

  async onStepStart(event: OnStepStartEvent): Promise<void> {
    const run = this.ensureRun(event.model, event.functionId);
    const startedAt = nowIso();
    const stepEventId = createId("event");
    run.steps.set(event.stepNumber, {
      eventId: stepEventId,
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
  }

  async onStepFinish(event: OnStepFinishEvent): Promise<void> {
    const run = this.ensureRun(event.model, event.functionId);
    const endedAt = nowIso();
    const activeStep =
      run.steps.get(event.stepNumber) ?? {
        eventId: createId("event"),
        startedAt: endedAt,
      };

    await this.write({
      schemaVersion: "0.2",
      eventId: createId("event"),
      runId: run.runId,
      parentId: activeStep.eventId,
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
  }

  async onToolCallStart(event: OnToolCallStartEvent): Promise<void> {
    const run = this.ensureRun(event.model, event.functionId);
    const startedAt = nowIso();
    const eventId = createId("event");
    const toolCall = event.toolCall;
    run.tools.set(toolCall.toolCallId, {
      eventId,
      startedAt,
      toolName: toolCall.toolName,
    });

    const step = event.stepNumber === undefined ? undefined : run.steps.get(event.stepNumber);

    await this.write({
      schemaVersion: "0.2",
      eventId,
      runId: run.runId,
      parentId: step?.eventId ?? run.eventId,
      kind: "TOOL",
      name: toolCall.toolName,
      status: "running",
      timestamp: startedAt,
      startedAt,
      confidence: "explicit",
      source: AI_SDK_SOURCE,
      attributes: {
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
  }

  async onToolCallFinish(event: OnToolCallFinishEvent): Promise<void> {
    const run = this.ensureRun(event.model, event.functionId);
    const endedAt = nowIso();
    const toolCall = event.toolCall;
    const activeTool =
      run.tools.get(toolCall.toolCallId) ?? {
        eventId: createId("event"),
        startedAt: endedAt,
        toolName: toolCall.toolName,
      };

    await this.write({
      schemaVersion: "0.2",
      eventId: createId("event"),
      runId: run.runId,
      parentId: activeTool.eventId,
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
  }

  async onFinish(event: OnFinishEvent): Promise<void> {
    const run = this.ensureRun(event.model, event.functionId);
    const endedAt = nowIso();

    await this.write({
      schemaVersion: "0.2",
      eventId: createId("event"),
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
  }

  private ensureRun(model: AiSdkModelInfo | undefined, functionId: string | undefined): ActiveRun {
    if (this.activeRun) return this.activeRun;

    const startedAt = nowIso();
    this.activeRun = {
      runId: createId("ai_sdk_run"),
      eventId: createId("event"),
      name: this.options.runName ?? functionId ?? model?.modelId ?? "ai-sdk-generation",
      startedAt,
      model,
      steps: new Map(),
      tools: new Map(),
    };
    return this.activeRun;
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
  };
}
