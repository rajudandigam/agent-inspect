import type { InspectEvent, InspectKind, InspectNode, InspectRunTree } from "../types/inspect-event.js";
import type {
  StepStartedEvent,
  StepType,
  TraceEvent,
} from "../types.js";

import { zeroKinds } from "./helpers.js";

function stepTypeToInspectKind(t: StepType): InspectKind {
  switch (t) {
    case "llm":
      return "LLM";
    case "tool":
      return "TOOL";
    case "decision":
      return "DECISION";
    case "run":
      return "CHAIN";
    default:
      return "LOGIC";
  }
}

function mapStepStatus(
  s: "success" | "error" | undefined,
): InspectEvent["status"] | undefined {
  if (s === undefined) return "running";
  if (s === "success") return "ok";
  return "error";
}

type StepAcc = {
  id: string;
  parentId?: string;
  name: string;
  type: StepType;
  startTime: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
  status?: "success" | "error";
  endTime?: number;
  durationMs?: number;
  error?: { message: string; stack?: string };
};

/**
 * Build an {@link InspectRunTree} from v0.1 JSONL {@link TraceEvent} rows (manual tracing).
 * Does not mutate the input array or event objects.
 */
export function manualTraceEventsToRunTree(events: TraceEvent[]): InspectRunTree {
  const started = events.find((e) => e.event === "run_started");
  if (!started || started.event !== "run_started") {
    throw new Error("Invalid trace: missing run_started");
  }

  const runId = started.runId;
  const runName = started.name;

  const completedAll = events.filter((e) => e.event === "run_completed");
  const lastCompleted = completedAll[completedAll.length - 1];

  let runStatus: InspectRunTree["status"];
  if (lastCompleted === undefined) {
    runStatus = "running";
  } else if (lastCompleted.status === "success") {
    runStatus = "ok";
  } else {
    runStatus = "error";
  }

  const startedAt = started.startTime;
  const endedAt =
    lastCompleted !== undefined && runStatus !== "running" ? lastCompleted.endTime : undefined;
  const durationMs =
    lastCompleted !== undefined && Number.isFinite(lastCompleted.durationMs)
      ? lastCompleted.durationMs
      : undefined;

  const steps = new Map<string, StepAcc>();

  for (const e of events) {
    if (e.event !== "step_started") continue;
    const s = e as StepStartedEvent;
    steps.set(s.stepId, {
      id: s.stepId,
      parentId: s.parentId,
      name: s.name,
      type: s.type,
      startTime: s.startTime,
      timestamp: s.timestamp,
      metadata: s.metadata as Record<string, unknown> | undefined,
    });
  }

  for (const e of events) {
    if (e.event !== "step_completed") continue;
    const acc = steps.get(e.stepId);
    if (!acc) continue;
    acc.status = e.status;
    acc.endTime = e.endTime;
    acc.durationMs = e.durationMs;
    if (e.error?.message) {
      acc.error = e.error;
    }
  }

  const inspectNodes = new Map<string, InspectNode>();

  for (const acc of steps.values()) {
    const kind = stepTypeToInspectKind(acc.type);
    const status = mapStepStatus(acc.status);
    const attrs: Record<string, unknown> = { ...(acc.metadata ?? {}) };
    if (acc.error?.message) {
      attrs.error = acc.error;
    }

    const evt: InspectEvent = {
      eventId: acc.id,
      runId,
      parentId: acc.parentId,
      name: acc.name,
      kind,
      timestamp: acc.timestamp,
      status,
      durationMs: acc.durationMs,
      attributes: Object.keys(attrs).length > 0 ? attrs : undefined,
      confidence: "explicit",
      source: { type: "manual" },
    };

    inspectNodes.set(acc.id, { event: evt, children: [], depth: 0 });
  }

  const roots: InspectNode[] = [];
  const sortByStart = (a: InspectNode, b: InspectNode) =>
    a.event.timestamp - b.event.timestamp;

  for (const node of inspectNodes.values()) {
    const pid = node.event.parentId;
    if (pid !== undefined && inspectNodes.has(pid)) {
      inspectNodes.get(pid)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  roots.sort(sortByStart);
  for (const n of inspectNodes.values()) {
    n.children.sort(sortByStart);
  }

  const assignDepth = (n: InspectNode, depth: number) => {
    n.depth = depth;
    for (const c of n.children) assignDepth(c, depth + 1);
  };
  for (const r of roots) assignDepth(r, 0);

  const confidenceBreakdown = {
    explicit: 0,
    correlated: 0,
    heuristic: 0,
    unknown: 0,
  } as InspectRunTree["metadata"]["confidenceBreakdown"];

  const kinds = zeroKinds();

  function countWalk(nodes: InspectNode[]): void {
    for (const n of nodes) {
      confidenceBreakdown[n.event.confidence] += 1;
      kinds[n.event.kind] += 1;
      if (n.children.length > 0) countWalk(n.children);
    }
  }
  countWalk(roots);

  return {
    runId,
    name: runName,
    status: runStatus,
    startedAt,
    endedAt,
    durationMs,
    children: roots,
    metadata: {
      totalEvents: inspectNodes.size,
      confidenceBreakdown,
      kinds,
    },
  };
}
