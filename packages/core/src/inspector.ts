import { createInspectorRuntime } from "./inspector-runtime.js";
import type { InspectorRuntime } from "./inspector-runtime.js";
import type { InspectKind } from "./types/inspect-event.js";
import type {
  PersistedInspectError,
  PersistedInspectEvent,
} from "./types/persisted-inspect-event.js";
import type { RedactionProfile, StepMetadata, StepType } from "./types.js";
import {
  preparePersistedInspectEventForWrite,
  resolveTraceSafetyOptions,
  type TraceSafetyOptions,
} from "./trace-event-safety.js";
import type { TraceWriter } from "./writers/index.js";
import {
  createRunId,
  createStepId,
  getDefaultTraceDir,
  truncateName,
} from "./utils.js";

export interface InspectorCaptureOptions {
  onSuccess?: "none" | "metadata-only";
  onError?: "none" | "metadata-only";
}

export interface CreateInspectorOptions {
  enabled?: boolean;
  writer?: TraceWriter;
  traceDir?: string;
  silent?: boolean;
  metadata?: Record<string, unknown>;
  redactionProfile?: RedactionProfile;
  capture?: InspectorCaptureOptions;
  traceSafety?: TraceSafetyOptions;
}

export interface InspectorRunOptions {
  runId?: string;
  traceDir?: string;
  silent?: boolean;
  metadata?: Record<string, unknown>;
}

export interface InspectorStepOptions {
  type?: StepType;
  metadata?: StepMetadata;
}

export type InspectorObserveOptions = InspectorStepOptions;

export interface Inspector {
  readonly runtime: InspectorRuntime;
  run<T>(
    name: string,
    fn: () => T | Promise<T>,
    options?: InspectorRunOptions,
  ): Promise<T>;
  step<T>(
    name: string,
    fn: () => T | Promise<T>,
    options?: InspectorStepOptions,
  ): Promise<T>;
  tool<T>(
    name: string,
    fn: () => T | Promise<T>,
    options?: InspectorStepOptions,
  ): Promise<T>;
  llm<T>(
    name: string,
    fn: () => T | Promise<T>,
    options?: InspectorStepOptions,
  ): Promise<T>;
  observe<TFunction extends (...args: any[]) => any>(
    name: string,
    fn: TFunction,
    options?: InspectorObserveOptions,
  ): (...args: Parameters<TFunction>) => Promise<Awaited<ReturnType<TFunction>>>;
  flush(): Promise<void>;
  close(): Promise<void>;
}

function normalizeName(name: unknown, fallback: string): string {
  if (typeof name !== "string" || name.trim() === "") return fallback;
  return truncateName(name.trim(), 100);
}

function nowIso(): string {
  return new Date().toISOString();
}

function durationMs(startedAt: string, endedAt: string): number {
  return Math.max(0, Date.parse(endedAt) - Date.parse(startedAt));
}

function mergeMetadata(
  base: Record<string, unknown> | undefined,
  override: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (base === undefined && override === undefined) return undefined;
  return {
    ...(base ?? {}),
    ...(override ?? {}),
  };
}

function toPersistedError(error: unknown): PersistedInspectError {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    };
  }
  if (typeof error === "string") {
    return { message: error };
  }
  return { message: "Unknown error" };
}

function stepTypeToKind(type: StepType): InspectKind {
  switch (type) {
    case "llm":
      return "LLM";
    case "tool":
      return "TOOL";
    case "decision":
      return "DECISION";
    case "run":
      return "RUN";
    default:
      return "LOGIC";
  }
}

export function createInspector(
  options: CreateInspectorOptions = {},
): Inspector {
  const traceSafety =
    options.traceSafety ??
    resolveTraceSafetyOptions({
      redactionProfile: options.redactionProfile,
    });
  const runtime = createInspectorRuntime({
    enabled: options.enabled,
    writer: options.writer,
    traceSafety,
  });

  async function write(event: PersistedInspectEvent): Promise<void> {
    const safe = preparePersistedInspectEventForWrite(event, traceSafety);
    if (safe !== undefined) {
      await runtime.write(safe);
    }
  }

  async function run<T>(
    name: string,
    fn: () => T | Promise<T>,
    runOptions: InspectorRunOptions = {},
  ): Promise<T> {
    if (typeof fn !== "function") {
      throw new TypeError("inspector.run requires `fn` to be a function");
    }
    if (options.enabled === false) {
      return Promise.resolve(fn());
    }

    const runName = normalizeName(name, "unnamed-run");
    const runId = runOptions.runId ?? createRunId();
    const traceDir = runOptions.traceDir ?? options.traceDir ?? getDefaultTraceDir();
    const metadata = mergeMetadata(options.metadata, runOptions.metadata);
    const startedAt = nowIso();

    return runtime.runWithContext(
      {
        runId,
        runName,
        traceDir,
        silent: runOptions.silent ?? options.silent ?? true,
        metadata,
      },
      async () => {
        await write({
          schemaVersion: "0.2",
          eventId: `${runId}_started`,
          runId,
          kind: "RUN",
          name: runName,
          status: "running",
          timestamp: startedAt,
          startedAt,
          confidence: "explicit",
          source: { type: "manual", name: "createInspector" },
          attributes: {
            legacyEvent: "run_started",
            ...(metadata !== undefined ? { metadata } : {}),
          },
        });

        try {
          const result = await Promise.resolve(fn());
          const endedAt = nowIso();
          await write({
            schemaVersion: "0.2",
            eventId: `${runId}_completed`,
            runId,
            kind: "RUN",
            name: runName,
            status: "ok",
            timestamp: endedAt,
            endedAt,
            durationMs: durationMs(startedAt, endedAt),
            confidence: "explicit",
            source: { type: "manual", name: "createInspector" },
            attributes: { legacyEvent: "run_completed" },
          });
          return result;
        } catch (error) {
          const endedAt = nowIso();
          await write({
            schemaVersion: "0.2",
            eventId: `${runId}_completed`,
            runId,
            kind: "RUN",
            name: runName,
            status: "error",
            timestamp: endedAt,
            endedAt,
            durationMs: durationMs(startedAt, endedAt),
            confidence: "explicit",
            source: { type: "manual", name: "createInspector" },
            attributes: { legacyEvent: "run_completed" },
            error: toPersistedError(error),
          });
          throw error;
        }
      },
    );
  }

  async function step<T>(
    name: string,
    fn: () => T | Promise<T>,
    stepOptions: InspectorStepOptions = {},
  ): Promise<T> {
    if (typeof fn !== "function") {
      throw new TypeError("inspector.step requires `fn` to be a function");
    }
    if (options.enabled === false || !runtime.getCurrentContext()) {
      return Promise.resolve(fn());
    }

    const context = runtime.getCurrentContext()!;
    const stepName = normalizeName(name, "unnamed-step");
    const stepId = createStepId();
    const parentId = runtime.getCurrentStepId();
    const stepType = stepOptions.type ?? "logic";
    const startedAt = nowIso();
    const attributes = {
      legacyEvent: "step_started",
      stepId,
      stepType,
      ...(stepOptions.metadata !== undefined
        ? { metadata: stepOptions.metadata }
        : {}),
    };

    await write({
      schemaVersion: "0.2",
      eventId: `${stepId}_started`,
      runId: context.runId,
      ...(parentId !== undefined ? { parentId } : {}),
      kind: stepTypeToKind(stepType),
      name: stepName,
      status: "running",
      timestamp: startedAt,
      startedAt,
      confidence: "explicit",
      source: { type: "manual", name: "createInspector" },
      attributes,
    });

    return runtime.runWithStepContext(stepId, async () => {
      try {
        const result = await Promise.resolve(fn());
        const endedAt = nowIso();
        await write({
          schemaVersion: "0.2",
          eventId: `${stepId}_completed`,
          runId: context.runId,
          kind: stepTypeToKind(stepType),
          name: stepName,
          status: "ok",
          timestamp: endedAt,
          endedAt,
          durationMs: durationMs(startedAt, endedAt),
          confidence: "explicit",
          source: { type: "manual", name: "createInspector" },
          attributes: {
            legacyEvent: "step_completed",
            stepId,
            stepType,
          },
        });
        return result;
      } catch (error) {
        const endedAt = nowIso();
        await write({
          schemaVersion: "0.2",
          eventId: `${stepId}_completed`,
          runId: context.runId,
          kind: stepTypeToKind(stepType),
          name: stepName,
          status: "error",
          timestamp: endedAt,
          endedAt,
          durationMs: durationMs(startedAt, endedAt),
          confidence: "explicit",
          source: { type: "manual", name: "createInspector" },
          attributes: {
            legacyEvent: "step_completed",
            stepId,
            stepType,
          },
          error: toPersistedError(error),
        });
        throw error;
      }
    });
  }

  const inspector: Inspector = {
    runtime,
    run,
    step,
    tool(name, fn, toolOptions) {
      const toolName = normalizeName(name, "unknown-tool");
      return step(`tool:${toolName}`, fn, {
        ...toolOptions,
        type: "tool",
        metadata: {
          ...(toolOptions?.metadata ?? {}),
          toolName,
        },
      });
    },
    llm(name, fn, llmOptions) {
      const model = normalizeName(name, "unknown-model");
      return step(`llm:${model}`, fn, {
        ...llmOptions,
        type: "llm",
        metadata: {
          ...(llmOptions?.metadata ?? {}),
          model,
        },
      });
    },
    observe(name, fn, observeOptions) {
      return async (...args) =>
        step(name, () => Promise.resolve(fn(...args)), observeOptions);
    },
    flush() {
      return runtime.flush();
    },
    close() {
      return runtime.close();
    },
  };

  return inspector;
}
