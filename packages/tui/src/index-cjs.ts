/**
 * @experimental Optional TUI package CommonJS entry.
 *
 * Keep this entry free of eager Ink imports so `require("@agent-inspect/tui")`
 * can load pure helpers even though Ink is ESM with top-level await.
 */
export type { TuiTraceModel, TuiTraceNode } from "./types.js";
export { buildTuiTraceModel, countTreeSteps } from "./tree-model.js";
export type { LoadTraceForTuiOptions } from "./trace-loader.js";
export { loadTraceForTui } from "./trace-loader.js";
export type { TuiAction } from "./keymap.js";
export { mapInputToAction } from "./keymap.js";
export type { TraceViewerAppProps } from "./app.js";
export { initialExpandedSet } from "./expand.js";
export type { RunTraceViewerOptions } from "./run-viewer.js";

import type { RunTraceViewerOptions } from "./run-viewer.js";

export async function runTraceViewer(options: RunTraceViewerOptions): Promise<void> {
  const esmEntry = "./index.mjs";
  const mod = await import(esmEntry) as {
    runTraceViewer(options: RunTraceViewerOptions): Promise<void>;
  };
  return mod.runTraceViewer(options);
}
