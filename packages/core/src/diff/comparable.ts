import type {
  RunCompletedEvent,
  RunStartedEvent,
  StepCompletedEvent,
  StepStartedEvent,
  StepType,
  TraceEvent,
} from "../types.js";

import type { RunComparable, StepComparable } from "./types.js";

type StepAcc = {
  id: string;
  parentId?: string;
  name: string;
  type: StepType;
  order: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
  status?: "success" | "error";
  durationMs?: number;
  errorMsg?: string;
};

function extractOutputPreview(meta: Record<string, unknown> | undefined): unknown {
  if (meta === undefined) return undefined;
  if ("outputPreview" in meta) return meta.outputPreview;
  if ("resultPreview" in meta) return meta.resultPreview;
  return undefined;
}

function mapStepStatus(s: "success" | "error" | undefined): string {
  if (s === undefined) return "running";
  return s;
}

/**
 * Normalize v0.1 manual JSONL events into a comparable run tree.
 * Does not mutate input events.
 */
export function manualTraceEventsToComparableRun(events: TraceEvent[]): RunComparable {
  const started = events.find((e) => e.event === "run_started");
  if (!started || started.event !== "run_started") {
    throw new Error("Invalid trace: missing run_started");
  }

  const rs = started as RunStartedEvent;
  const runId = rs.runId;

  const completedAll = events.filter((e) => e.event === "run_completed");
  const lastCompleted = completedAll[completedAll.length - 1] as RunCompletedEvent | undefined;

  let runStatus: string | undefined;
  if (lastCompleted === undefined) runStatus = "running";
  else runStatus = lastCompleted.status;

  const durationMs =
    lastCompleted !== undefined && Number.isFinite(lastCompleted.durationMs)
      ? lastCompleted.durationMs
      : undefined;

  const steps = new Map<string, StepAcc>();
  let order = 0;

  for (const e of events) {
    if (e.event !== "step_started") continue;
    const s = e as StepStartedEvent;
    const meta = s.metadata ? { ...(s.metadata as Record<string, unknown>) } : undefined;
    steps.set(s.stepId, {
      id: s.stepId,
      parentId: s.parentId,
      name: s.name,
      type: s.type,
      order: order++,
      timestamp: s.timestamp,
      metadata: meta,
    });
  }

  for (const e of events) {
    if (e.event !== "step_completed") continue;
    const acc = steps.get(e.stepId);
    if (!acc) continue;
    acc.status = e.status;
    acc.durationMs = e.durationMs;
    if (e.error?.message) acc.errorMsg = e.error.message;
    const extra = e as StepCompletedEvent & { metadata?: Record<string, unknown> };
    if (extra.metadata !== undefined && typeof extra.metadata === "object") {
      acc.metadata = { ...(acc.metadata ?? {}), ...extra.metadata };
    }
  }

  const nodes = new Map<string, StepComparable>();

  for (const acc of steps.values()) {
    let meta = acc.metadata ? { ...acc.metadata } : undefined;
    if (acc.parentId !== undefined && !steps.has(acc.parentId)) {
      meta = { ...(meta ?? {}), agent_inspect_diff_parent_missing: true };
    }

    // Previews are compared as their own "output" dimension; strip them from
    // the metadata copy so one preview change is not also reported as a
    // metadata diff.
    const outputPreview = extractOutputPreview(meta);
    if (meta !== undefined && ("outputPreview" in meta || "resultPreview" in meta)) {
      delete meta.outputPreview;
      delete meta.resultPreview;
    }

    const sc: StepComparable = {
      id: acc.id,
      name: acc.name,
      type: acc.type,
      status: mapStepStatus(acc.status),
      durationMs: acc.durationMs,
      error: acc.errorMsg,
      metadata: meta && Object.keys(meta).length > 0 ? meta : undefined,
      outputPreview,
      children: [],
    };
    nodes.set(acc.id, sc);
  }

  const roots: StepComparable[] = [];
  const sortByOrder = (a: StepComparable, b: StepComparable) => {
    const oa = steps.get(a.id)?.order ?? 0;
    const ob = steps.get(b.id)?.order ?? 0;
    return oa - ob;
  };

  for (const acc of steps.values()) {
    const node = nodes.get(acc.id)!;
    if (acc.parentId !== undefined && nodes.has(acc.parentId)) {
      nodes.get(acc.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  roots.sort(sortByOrder);
  for (const n of nodes.values()) {
    n.children.sort(sortByOrder);
  }

  return {
    runId,
    name: rs.name,
    status: runStatus,
    durationMs,
    steps: roots,
  };
}
