import { runWithContext } from "./context.js";
import type { ExecutionContext, InspectRunOptions, TraceEvent } from "./types.js";
import { initializeTraceFile, writeTraceEvent } from "./storage.js";
import { printRunComplete, printRunStart } from "./terminal.js";
import { resolveTraceDir } from "./trace-directory.js";
import {
  createRunId,
  formatError,
  getTraceFilePath,
  truncateName,
  warn,
} from "./utils.js";

function normalizeRunName(name: unknown): string {
  if (typeof name !== "string" || name.trim() === "") {
    return "unnamed-run";
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
    warn(`inspectRun: ${label}`, e);
  }
}

/**
 * Stable v1.0 API for local manual run tracing.
 *
 * Runs `fn` inside an AgentInspect trace: JSONL `run_started` / `run_completed`, optional terminal output,
 * and {@link ExecutionContext} for nested APIs. Instrumentation failures are swallowed; user errors are re-thrown.
 */
export async function inspectRun<T>(
  name: string,
  fn: () => Promise<T> | T,
  options?: InspectRunOptions,
): Promise<T> {
  if (typeof fn !== "function") {
    throw new TypeError("inspectRun requires `fn` to be a function");
  }

  if (options?.enabled === false) {
    return Promise.resolve(fn());
  }

  const runName = normalizeRunName(name);
  const runId = createRunId();
  const traceDir = resolveTraceDir({ dir: options?.traceDir });

  const context: ExecutionContext = {
    runId,
    runName,
    traceDir,
    silent: options?.silent ?? false,
    metadata: options?.metadata,
  };

  return runWithContext(context, async () => {
    const startTime = Date.now();
    let traceFilePath: string | undefined;

    await safeInstrumentation("initializeTraceFile", async () => {
      traceFilePath = await initializeTraceFile(runId, traceDir);
    });

    await safeInstrumentation("writeTraceEvent(run_started)", async () => {
      const started: TraceEvent = {
        schemaVersion: "0.1",
        event: "run_started",
        timestamp: startTime,
        runId,
        name: runName,
        startTime,
        ...(options?.metadata !== undefined
          ? { metadata: options.metadata }
          : {}),
      };
      await writeTraceEvent(started, traceDir);
    });

    await safeInstrumentation("printRunStart", () => {
      printRunStart(runId, runName);
    });

    let result: T;
    try {
      result = await Promise.resolve(fn());
    } catch (userError) {
      const endTime = Date.now();
      const durationMs = endTime - startTime;
      const formatted = formatError(userError);
      const printPath = traceFilePath ?? getTraceFilePath(runId, traceDir);

      await safeInstrumentation("writeTraceEvent(run_completed error)", async () => {
        const completed: TraceEvent = {
          schemaVersion: "0.1",
          event: "run_completed",
          timestamp: endTime,
          runId,
          status: "error",
          endTime,
          durationMs,
          error: formatted,
        };
        await writeTraceEvent(completed, traceDir);
      });

      await safeInstrumentation("printRunComplete(error)", () => {
        printRunComplete(runName, runId, durationMs, "error", printPath);
      });

      throw userError;
    }

    const endTime = Date.now();
    const durationMs = endTime - startTime;
    const printPath = traceFilePath ?? getTraceFilePath(runId, traceDir);

    await safeInstrumentation("writeTraceEvent(run_completed success)", async () => {
      const completed: TraceEvent = {
        schemaVersion: "0.1",
        event: "run_completed",
        timestamp: endTime,
        runId,
        status: "success",
        endTime,
        durationMs,
      };
      await writeTraceEvent(completed, traceDir);
    });

    await safeInstrumentation("printRunComplete(success)", () => {
      printRunComplete(runName, runId, durationMs, "success", printPath);
    });

    return result;
  });
}
