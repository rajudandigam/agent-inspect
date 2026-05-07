import type { InspectEvent, InspectNode, InspectRunTree } from "../types/inspect-event.js";
import type { LogIngestConfig } from "../types/log-config.js";

export interface TreeBuilderOptions {
  config?: LogIngestConfig;
}

function inc<T extends string>(map: Record<T, number>, key: T): void {
  map[key] = (map[key] ?? 0) + 1;
}

function computeRunStatus(events: InspectEvent[]): InspectRunTree["status"] {
  let hasRunning = false;
  for (const e of events) {
    if (e.status === "error") return "error";
    if (e.status === "running") hasRunning = true;
  }
  if (hasRunning) return "running";
  return "ok";
}

export class TreeBuilder {
  constructor(options?: TreeBuilderOptions) {
    void options?.config;
  }

  build(events: InspectEvent[]): InspectRunTree[] {
    const byRun = new Map<string, InspectEvent[]>();
    for (const e of events) {
      if (!byRun.has(e.runId)) byRun.set(e.runId, []);
      byRun.get(e.runId)!.push(e);
    }

    const out: InspectRunTree[] = [];
    for (const [runId, runEvents] of byRun.entries()) {
      const sorted = [...runEvents].sort((a, b) => a.timestamp - b.timestamp);

      const nodes = new Map<string, InspectNode>();
      for (const e of sorted) {
        nodes.set(e.eventId, { event: e, children: [], depth: 0 });
      }

      const roots: InspectNode[] = [];
      for (const node of nodes.values()) {
        const parentId = node.event.parentId;
        if (parentId && nodes.has(parentId)) {
          nodes.get(parentId)!.children.push(node);
        } else {
          roots.push(node);
        }
      }

      const assignDepth = (n: InspectNode, depth: number) => {
        n.depth = depth;
        for (const c of n.children) assignDepth(c, depth + 1);
      };
      for (const r of roots) assignDepth(r, 0);

      // metadata
      const confidenceBreakdown = {
        explicit: 0,
        correlated: 0,
        heuristic: 0,
        unknown: 0,
      } as Record<InspectEvent["confidence"], number>;
      const kinds = {} as Record<InspectEvent["kind"], number>;
      for (const e of sorted) {
        inc(confidenceBreakdown, e.confidence);
        (kinds as any)[e.kind] = ((kinds as any)[e.kind] ?? 0) + 1;
      }

      const startedAt = sorted.length > 0 ? sorted[0]!.timestamp : undefined;
      const endedAt = sorted.length > 0 ? sorted[sorted.length - 1]!.timestamp : undefined;
      const status = computeRunStatus(sorted);
      const durationMs =
        startedAt !== undefined &&
        endedAt !== undefined &&
        Number.isFinite(startedAt) &&
        Number.isFinite(endedAt) &&
        endedAt >= startedAt &&
        status !== "running"
          ? endedAt - startedAt
          : undefined;

      const name = sorted.find((e) => e.kind === "RUN")?.name;

      out.push({
        runId,
        name,
        status,
        startedAt,
        endedAt: status === "running" ? undefined : endedAt,
        durationMs,
        children: roots,
        metadata: {
          totalEvents: sorted.length,
          confidenceBreakdown,
          kinds,
        },
      });
    }

    // newest first for stable display
    out.sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0));
    return out;
  }
}

