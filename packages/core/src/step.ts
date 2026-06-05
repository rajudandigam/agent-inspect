import {
  getCurrentContext,
  getCurrentDepth,
  getParentStepId,
  getTraceSafetyFromContext,
  runWithStepContext,
} from "./context.js";
import type { StepOptions, StepType, TraceEvent } from "./types.js";
import { writeTraceEvent } from "./storage.js";
import { printFailedAt, printError, printStepComplete, printStepStart } from "./terminal.js";
import { prepareTraceEventForDisk } from "./trace-event-safety.js";
import { createStepId, formatError, truncateName, warn } from "./utils.js";

function normalizeStepName(name: unknown): string {
  if (typeof name !== "string" || name.trim() === "") {
    return "unnamed-step";
  }
  return truncateName(name.trim(), 100);
}

async function safeInstrumentation(
  label: string,
  op: () => void | Promise<void>,
): Promise<void> {
  try {
    await Promise.resolve(op());
  } catch (e) {
    warn(`step: ${label}`, e);
  }
}

async function stepImpl<T>(
  name: string,
  fn: () => Promise<T> | T,
  options?: StepOptions,
): Promise<T> {
  if (typeof fn !== "function") {
    throw new TypeError("step requires `fn` to be a function");
  }

  const stepName = normalizeStepName(name);
  const context = getCurrentContext();

  if (!context) {
    warn("step() called outside inspectRun(); executing without instrumentation");
    return Promise.resolve(fn());
  }

  const stepId = createStepId();
  const renderDepth = getCurrentDepth();
  const parentId = getParentStepId();
  const stepType: StepType = options?.type ?? "logic";
  const metadata = options?.metadata;
  const traceSafety = getTraceSafetyFromContext();
  const startTime = Date.now();

  await safeInstrumentation("writeTraceEvent(step_started)", async () => {
    const started: TraceEvent = {
      schemaVersion: "0.1",
      event: "step_started",
      timestamp: startTime,
      runId: context.runId,
      stepId,
      ...(typeof parentId === "string" && parentId.trim() !== ""
        ? { parentId }
        : {}),
      name: stepName,
      type: stepType,
      startTime,
      ...(metadata !== undefined ? { metadata } : {}),
    };
    const safe =
      traceSafety !== undefined
        ? prepareTraceEventForDisk(started, traceSafety)
        : started;
    await writeTraceEvent(safe, context.traceDir);
  });

  await safeInstrumentation("printStepStart", () => {
    printStepStart(stepName, renderDepth);
  });

  let result: T;
  try {
    result = await runWithStepContext(stepId, async () => {
      return await Promise.resolve(fn());
    });
  } catch (userError) {
    const endTime = Date.now();
    const durationMs = endTime - startTime;
    const formatted = formatError(userError);

    await safeInstrumentation("writeTraceEvent(step_completed error)", async () => {
      const completed: TraceEvent = {
        schemaVersion: "0.1",
        event: "step_completed",
        timestamp: endTime,
        runId: context.runId,
        stepId,
        status: "error",
        endTime,
        durationMs,
        error: formatted,
      };
      const safe =
        traceSafety !== undefined
          ? prepareTraceEventForDisk(completed, traceSafety)
          : completed;
      await writeTraceEvent(safe, context.traceDir);
    });

    await safeInstrumentation("printStepComplete(error)", () => {
      printStepComplete(stepName, durationMs, "error", renderDepth);
    });
    await safeInstrumentation("printError", () => {
      printError(formatted, renderDepth);
    });
    await safeInstrumentation("printFailedAt", () => {
      printFailedAt(stepName);
    });

    throw userError;
  }

  const endTime = Date.now();
  const durationMs = endTime - startTime;

  await safeInstrumentation("writeTraceEvent(step_completed success)", async () => {
    const completed: TraceEvent = {
      schemaVersion: "0.1",
      event: "step_completed",
      timestamp: endTime,
      runId: context.runId,
      stepId,
      status: "success",
      endTime,
      durationMs,
    };
    const safe =
      traceSafety !== undefined
        ? prepareTraceEventForDisk(completed, traceSafety)
        : completed;
    await writeTraceEvent(safe, context.traceDir);
  });

  await safeInstrumentation("printStepComplete(success)", () => {
    printStepComplete(stepName, durationMs, "success", renderDepth);
  });

  return result;
}

/**
 * Stable v1.0 API for instrumenting a named step inside an AgentInspect run.
 *
 * Callable step tracer plus {@link step.llm} and {@link step.tool} shortcuts.
 */
export type StepFunction = {
  <T>(name: string, fn: () => Promise<T> | T, options?: StepOptions): Promise<T>;
  llm: <T>(model: string, fn: () => Promise<T> | T) => Promise<T>;
  tool: <T>(toolName: string, fn: () => Promise<T> | T) => Promise<T>;
};

async function stepLlm<T>(model: string, fn: () => Promise<T> | T): Promise<T> {
  const modelName =
    typeof model === "string" && model.trim() !== ""
      ? model.trim()
      : "unknown-model";
  return stepImpl<T>(`llm:${modelName}`, fn, {
    type: "llm",
    metadata: { model: modelName },
  });
}

async function stepTool<T>(
  toolName: string,
  fn: () => Promise<T> | T,
): Promise<T> {
  const normalized =
    typeof toolName === "string" && toolName.trim() !== ""
      ? toolName.trim()
      : "unknown-tool";
  return stepImpl<T>(`tool:${normalized}`, fn, {
    type: "tool",
    metadata: { toolName: normalized },
  });
}

/**
 * Traces a named unit of work inside `inspectRun` (`step_started` / `step_completed`, optional terminal).
 * Outside a run, executes `fn` with a warn only. Preserves return values and rethrows user errors unchanged.
 *
 * - `step.llm(model, fn)` — `type: "llm"`, `metadata.model` (no SDK calls or token counting).
 * - `step.tool(toolName, fn)` — `type: "tool"`, `metadata.toolName` (no framework interception).
 */
export const step = Object.assign(stepImpl, {
  llm: stepLlm,
  tool: stepTool,
}) as StepFunction;
