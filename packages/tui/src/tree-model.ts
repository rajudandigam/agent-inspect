import type {
  RunCompletedEvent,
  RunStartedEvent,
  StepCompletedEvent,
  StepStartedEvent,
  TraceEvent,
} from "agent-inspect";

import type { TuiTraceModel, TuiTraceNode } from "./types.js";

type StepBuild = {
  id: string;
  parentId?: string;
  name: string;
  type: string;
  status: string;
  durationMs?: number;
  startedAt: number;
  error?: string;
  metadata?: Record<string, unknown>;
  children: StepBuild[];
};

function dfsFlat(roots: TuiTraceNode[], out: TuiTraceNode[]): void {
  for (const n of roots) {
    out.push(n);
    if (n.children.length > 0) dfsFlat(n.children, out);
  }
}

function toTuiNodes(builds: StepBuild[], depth: number): TuiTraceNode[] {
  return builds.map((b) => ({
    id: b.id,
    name: b.name,
    type: b.type,
    status: b.status,
    durationMs: b.durationMs,
    depth,
    parentId: b.parentId,
    error: b.error,
    metadata: b.metadata,
    children: toTuiNodes(b.children, depth + 1),
  }));
}

/**
 * Build a navigable tree model from v0.1 JSONL trace events.
 * Does not mutate the input array or event objects.
 */
export function buildTuiTraceModel(events: TraceEvent[]): TuiTraceModel {
  const started = events.find((e): e is RunStartedEvent => e.event === "run_started");
  if (!started) {
    throw new Error("Invalid trace: missing run_started");
  }

  const runId = started.runId;
  const runName = started.name;

  const completedAll = events.filter((e): e is RunCompletedEvent => e.event === "run_completed");
  const lastCompleted = completedAll[completedAll.length - 1];
  const runStatus = lastCompleted ? lastCompleted.status : "running";
  const runDurationMs =
    lastCompleted !== undefined && Number.isFinite(lastCompleted.durationMs)
      ? lastCompleted.durationMs
      : undefined;

  const nodes = new Map<string, StepBuild>();

  for (const e of events) {
    if (e.event !== "step_started") continue;
    const s = e as StepStartedEvent;
    nodes.set(s.stepId, {
      id: s.stepId,
      parentId: s.parentId,
      name: s.name,
      type: s.type,
      status: "running",
      startedAt: s.startTime,
      metadata: s.metadata as Record<string, unknown> | undefined,
      children: [],
    });
  }

  for (const e of events) {
    if (e.event !== "step_completed") continue;
    const c = e as StepCompletedEvent;
    const node = nodes.get(c.stepId);
    if (!node) continue;
    node.status = c.status;
    node.durationMs = c.durationMs;
    node.error =
      c.error !== undefined && typeof c.error.message === "string"
        ? c.error.message
        : undefined;
  }

  const roots: StepBuild[] = [];
  const sortByStarted = (a: StepBuild, b: StepBuild) => a.startedAt - b.startedAt;

  for (const n of nodes.values()) {
    if (n.parentId !== undefined && nodes.has(n.parentId)) {
      nodes.get(n.parentId)!.children.push(n);
    } else {
      roots.push(n);
    }
  }

  roots.sort(sortByStarted);
  for (const n of nodes.values()) {
    n.children.sort(sortByStarted);
  }

  const treeRoots = toTuiNodes(roots, 0);
  const flatNodes: TuiTraceNode[] = [];
  dfsFlat(treeRoots, flatNodes);

  return {
    runId,
    name: runName,
    status: runStatus,
    durationMs: runDurationMs,
    nodes: treeRoots,
    flatNodes,
  };
}

/** Total step count in tree (for default expand policy). Exported for tests. */
export function countTreeSteps(roots: TuiTraceNode[]): number {
  let n = 0;
  for (const r of roots) {
    n += 1 + countSubtree(r.children);
  }
  return n;
}

function countSubtree(children: TuiTraceNode[]): number {
  let n = 0;
  for (const c of children) {
    n += 1 + countSubtree(c.children);
  }
  return n;
}
