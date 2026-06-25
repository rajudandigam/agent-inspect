import { AsyncLocalStorage } from "node:async_hooks";

import { extractCorrelationMetadata } from "./correlation-metadata.js";
import type { ExecutionContext, TraceCorrelationMetadata } from "./types.js";
import {
  resolveTraceSafetyOptions,
  type TraceSafetyOptions,
} from "./trace-event-safety.js";
import type { PersistedInspectEvent } from "./types/persisted-inspect-event.js";
import type { TraceWriter, TraceWriterStats } from "./writers/index.js";

export interface InspectorRuntimeOptions {
  enabled?: boolean;
  writer?: TraceWriter;
  traceSafety?: TraceSafetyOptions;
}

export interface InspectorRuntimeContext extends ExecutionContext {
  runtimeId: string;
}

export interface InspectorRuntimeDiagnostics {
  instrumentationErrors: number;
  lastInstrumentationError?: string;
  writerStats?: TraceWriterStats;
}

type RuntimeStore = InspectorRuntimeContext & {
  currentStepId?: string;
  currentDepth: number;
  traceSafety: TraceSafetyOptions;
};

export interface InspectorRuntime {
  readonly runtimeId: string;
  readonly enabled: boolean;
  runWithContext<T>(
    context: ExecutionContext,
    fn: () => Promise<T> | T,
  ): Promise<T>;
  runWithStepContext<T>(
    stepId: string,
    fn: () => Promise<T> | T,
  ): Promise<T>;
  getCurrentContext(): InspectorRuntimeContext | undefined;
  getCurrentCorrelationMetadata(): TraceCorrelationMetadata | undefined;
  getCurrentStepId(): string | undefined;
  getCurrentDepth(): number;
  getTraceSafety(): TraceSafetyOptions;
  write(event: PersistedInspectEvent): Promise<void>;
  flush(): Promise<void>;
  close(): Promise<void>;
  getDiagnostics(): InspectorRuntimeDiagnostics;
}

function invoke<T>(fn: () => T | Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    try {
      Promise.resolve(fn()).then(resolve, reject);
    } catch (error) {
      reject(error);
    }
  });
}

function normalizeError(error: unknown): string {
  if (error instanceof Error && error.message.trim() !== "") {
    return error.message;
  }
  if (typeof error === "string" && error.trim() !== "") {
    return error;
  }
  return "Unknown inspector runtime error";
}

let runtimeSequence = 0;

function createRuntimeId(): string {
  runtimeSequence += 1;
  return `runtime_${runtimeSequence.toString(36)}`;
}

function publicContext(store: RuntimeStore): InspectorRuntimeContext {
  return {
    runtimeId: store.runtimeId,
    runId: store.runId,
    runName: store.runName,
    traceDir: store.traceDir,
    silent: store.silent,
    metadata: store.metadata,
  };
}

export function createInspectorRuntime(
  options: InspectorRuntimeOptions = {},
): InspectorRuntime {
  const storage = new AsyncLocalStorage<RuntimeStore>();
  const enabled = options.enabled ?? true;
  const runtimeId = createRuntimeId();
  const traceSafety = options.traceSafety ?? resolveTraceSafetyOptions();
  let closed = false;
  let instrumentationErrors = 0;
  let lastInstrumentationError: string | undefined;

  function recordInstrumentationError(error: unknown): void {
    instrumentationErrors += 1;
    lastInstrumentationError = normalizeError(error);
  }

  function currentStore(): RuntimeStore | undefined {
    try {
      return storage.getStore();
    } catch (error) {
      recordInstrumentationError(error);
      return undefined;
    }
  }

  const runtime: InspectorRuntime = {
    runtimeId,
    enabled,
    runWithContext(context, fn) {
      if (!enabled) return invoke(fn);

      const store: RuntimeStore = {
        runtimeId,
        runId: context.runId,
        runName: context.runName,
        traceDir: context.traceDir,
        silent: context.silent,
        metadata: context.metadata,
        traceSafety,
        currentDepth: 0,
      };

      return new Promise((resolve, reject) => {
        storage.run(store, () => {
          invoke(fn).then(resolve, reject);
        });
      });
    },
    runWithStepContext(stepId, fn) {
      if (!enabled) return invoke(fn);
      const parent = currentStore();
      if (!parent) return invoke(fn);

      const store: RuntimeStore = {
        runtimeId,
        runId: parent.runId,
        runName: parent.runName,
        traceDir: parent.traceDir,
        silent: parent.silent,
        metadata: parent.metadata,
        traceSafety: parent.traceSafety,
        currentStepId: stepId,
        currentDepth: parent.currentDepth + 1,
      };

      return new Promise((resolve, reject) => {
        storage.run(store, () => {
          invoke(fn).then(resolve, reject);
        });
      });
    },
    getCurrentContext() {
      const store = currentStore();
      return store ? publicContext(store) : undefined;
    },
    getCurrentCorrelationMetadata() {
      return extractCorrelationMetadata(currentStore()?.metadata);
    },
    getCurrentStepId() {
      return currentStore()?.currentStepId;
    },
    getCurrentDepth() {
      const depth = currentStore()?.currentDepth;
      return typeof depth === "number" && Number.isFinite(depth) ? depth : 0;
    },
    getTraceSafety() {
      return traceSafety;
    },
    async write(event) {
      if (!enabled || closed || !options.writer) return;
      try {
        await options.writer.write(event);
      } catch (error) {
        recordInstrumentationError(error);
      }
    },
    async flush() {
      if (!options.writer) return;
      try {
        await options.writer.flush?.();
      } catch (error) {
        recordInstrumentationError(error);
      }
    },
    async close() {
      if (closed) return;
      try {
        await options.writer?.close?.();
      } catch (error) {
        recordInstrumentationError(error);
      } finally {
        closed = true;
      }
    },
    getDiagnostics() {
      const diagnostics: InspectorRuntimeDiagnostics = {
        instrumentationErrors,
      };
      if (lastInstrumentationError !== undefined) {
        diagnostics.lastInstrumentationError = lastInstrumentationError;
      }
      const writerStats = options.writer?.getStats?.();
      if (writerStats !== undefined) {
        diagnostics.writerStats = writerStats;
      }
      return diagnostics;
    },
  };

  return runtime;
}
