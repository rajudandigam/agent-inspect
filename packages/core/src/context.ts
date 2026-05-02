import { AsyncLocalStorage } from "node:async_hooks";

import type { ExecutionContext } from "./types.js";

type RuntimeExecutionContext = ExecutionContext & {
  currentStepId?: string;
  currentDepth: number;
};

const storage = new AsyncLocalStorage<RuntimeExecutionContext>();

function toPublicContext(ctx: RuntimeExecutionContext): ExecutionContext {
  return {
    runId: ctx.runId,
    runName: ctx.runName,
    traceDir: ctx.traceDir,
    silent: ctx.silent,
    metadata: ctx.metadata,
  };
}

function invoke<T>(fn: () => T | Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    try {
      Promise.resolve(fn()).then(resolve, reject);
    } catch (e) {
      reject(e);
    }
  });
}

/** Returns the active run context, without internal step fields. */
export function getCurrentContext(): ExecutionContext | undefined {
  try {
    const s = storage.getStore();
    if (!s) return undefined;
    return toPublicContext(s);
  } catch {
    return undefined;
  }
}

/** Active `runId` when inside `runWithContext`, else `undefined`. */
export function getCurrentRunId(): string | undefined {
  try {
    return storage.getStore()?.runId;
  } catch {
    return undefined;
  }
}

/** Active `runName` when inside `runWithContext`, else `undefined`. */
export function getCurrentRunName(): string | undefined {
  try {
    return storage.getStore()?.runName;
  } catch {
    return undefined;
  }
}

/**
 * Active step id in this async scope (parent for nested `step()` calls).
 * `undefined` at run root or outside any run.
 */
export function getCurrentStepId(): string | undefined {
  try {
    return storage.getStore()?.currentStepId;
  } catch {
    return undefined;
  }
}

/** Alias of {@link getCurrentStepId} for readability in step instrumentation. */
export function getParentStepId(): string | undefined {
  return getCurrentStepId();
}

/**
 * Nesting depth: `0` at run root, increments by one per nested `runWithStepContext`.
 * Returns `0` outside any run.
 */
export function getCurrentDepth(): number {
  try {
    const d = storage.getStore()?.currentDepth;
    return typeof d === "number" && Number.isFinite(d) ? d : 0;
  } catch {
    return 0;
  }
}

export function hasActiveContext(): boolean {
  try {
    return storage.getStore() !== undefined;
  } catch {
    return false;
  }
}

export function getTraceDirFromContext(): string | undefined {
  try {
    return storage.getStore()?.traceDir;
  } catch {
    return undefined;
  }
}

export function isSilentContext(): boolean {
  try {
    const s = storage.getStore();
    return s ? s.silent : false;
  } catch {
    return false;
  }
}

/**
 * Runs `fn` with a fresh AgentInspect run context (depth 0, no active step).
 * Propagates sync/async results and rejections; does not swallow user errors.
 */
export function runWithContext<T>(
  context: ExecutionContext,
  fn: () => Promise<T> | T,
): Promise<T> {
  const runtime: RuntimeExecutionContext = {
    runId: context.runId,
    runName: context.runName,
    traceDir: context.traceDir,
    silent: context.silent,
    metadata: context.metadata,
    currentDepth: 0,
  };

  return new Promise((resolve, reject) => {
    storage.run(runtime, () => {
      try {
        Promise.resolve(fn()).then(resolve, reject);
      } catch (e) {
        reject(e);
      }
    });
  });
}

/**
 * Runs `fn` with `stepId` as the active step (incremented depth).
 * If no run is active, runs `fn` without altering async context.
 */
export function runWithStepContext<T>(
  stepId: string,
  fn: () => Promise<T> | T,
): Promise<T> {
  let parent: RuntimeExecutionContext | undefined;
  try {
    parent = storage.getStore();
  } catch {
    parent = undefined;
  }

  if (!parent) {
    return invoke(fn);
  }

  const derived: RuntimeExecutionContext = {
    runId: parent.runId,
    runName: parent.runName,
    traceDir: parent.traceDir,
    silent: parent.silent,
    metadata: parent.metadata,
    currentStepId: stepId,
    currentDepth: parent.currentDepth + 1,
  };

  return new Promise((resolve, reject) => {
    storage.run(derived, () => {
      try {
        Promise.resolve(fn()).then(resolve, reject);
      } catch (e) {
        reject(e);
      }
    });
  });
}
