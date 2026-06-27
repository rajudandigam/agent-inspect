import { readTraceEvents, resolveTraceDir } from "agent-inspect/advanced";

import { buildTuiTraceModel } from "./tree-model.js";
import type { TuiTraceModel } from "./types.js";

export interface LoadTraceForTuiOptions {
  runId: string;
  dir?: string;
}

/**
 * Load JSONL trace events and build a TUI model. Does not write or mutate trace files.
 */
export async function loadTraceForTui(options: LoadTraceForTuiOptions): Promise<TuiTraceModel> {
  const traceDir = resolveTraceDir({ dir: options.dir });
  const events = await readTraceEvents(options.runId, traceDir);

  if (events.length === 0) {
    throw new Error(
      `Run not found or trace is empty: ${options.runId} (directory: ${traceDir})`,
    );
  }

  return buildTuiTraceModel(events);
}
