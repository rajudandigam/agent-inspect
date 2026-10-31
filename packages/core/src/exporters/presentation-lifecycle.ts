/**
 * Presentation-only lifecycle join for HTML/Markdown trees.
 * Does not mutate the input tree or original events. Nested v0.1 pairs that
 * sit on different parents still need coalesceLifecycle at tree-build time;
 * this helper joins sibling start/complete rows that share run/step identity,
 * while preserving distinct attempts (including a later running attempt).
 */
import type { InspectEvent, InspectNode, InspectRunTree } from "../types/inspect-event.js";

function stepIdOf(event: InspectEvent): string | undefined {
  const value = event.attributes?.stepId;
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function attemptIdOf(event: InspectEvent): string | undefined {
  const direct = event.attributes?.attemptId;
  if (typeof direct === "string" && direct.trim() !== "") return direct;
  const meta = event.attributes?.metadata;
  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    const nested = (meta as Record<string, unknown>).attemptId;
    if (typeof nested === "string" && nested.trim() !== "") return nested;
  }
  return undefined;
}

function lifecycleKey(event: InspectEvent): string {
  if (event.kind === "RUN") return `run:${event.runId}`;
  const stepId = stepIdOf(event);
  if (stepId !== undefined) return `step:${stepId}`;
  return `event:${event.eventId}`;
}

function isTerminal(status: InspectEvent["status"]): boolean {
  return status === "ok" || status === "error";
}

function eventTime(event: InspectEvent): number {
  return typeof event.timestamp === "number" ? event.timestamp : 0;
}

function cloneNode(node: InspectNode): InspectNode {
  return {
    event: {
      ...node.event,
      ...(node.event.attributes !== undefined
        ? { attributes: { ...node.event.attributes } }
        : {}),
    },
    children: node.children.map(cloneNode),
    depth: node.depth,
  };
}

function joinOnePair(start: InspectNode | undefined, terminal: InspectNode): InspectNode {
  const childMap = new Map<string, InspectNode>();
  if (start) {
    for (const child of start.children) {
      childMap.set(child.event.eventId, child);
    }
  }
  for (const child of terminal.children) {
    childMap.set(child.event.eventId, child);
  }
  return {
    event: {
      ...terminal.event,
      name: start?.event.name ?? terminal.event.name,
      kind: start?.event.kind ?? terminal.event.kind,
      ...(start && attemptIdOf(terminal.event) === undefined && attemptIdOf(start.event)
        ? {
            attributes: {
              ...terminal.event.attributes,
              attemptId: attemptIdOf(start.event),
            },
          }
        : {}),
    },
    children: presentSiblingNodes([...childMap.values()]),
    depth: terminal.depth,
  };
}

/**
 * Join start/complete siblings for one stepId group.
 * Distinct attemptIds stay separate; a later running attempt is never hidden
 * by an earlier completion. Conflicting terminals stay visible.
 */
function joinSiblingGroup(group: InspectNode[]): InspectNode[] {
  if (group.length <= 1) return group;

  const terminals = group
    .filter((n) => isTerminal(n.event.status))
    .sort((a, b) => eventTime(a.event) - eventTime(b.event));
  const runnings = group
    .filter((n) => n.event.status === "running")
    .sort((a, b) => eventTime(a.event) - eventTime(b.event));
  const others = group.filter(
    (n) => !isTerminal(n.event.status) && n.event.status !== "running",
  );

  const terminalStatuses = new Set(terminals.map((n) => n.event.status));
  if (terminalStatuses.size > 1) {
    return group;
  }
  // Multiple same-status terminals without distinguishable attempts: do not guess.
  if (
    terminals.length > 1 &&
    terminals.every((t) => attemptIdOf(t.event) === undefined) &&
    runnings.every((r) => attemptIdOf(r.event) === undefined)
  ) {
    return group;
  }

  const usedRunning = new Set<string>();
  const out: InspectNode[] = [];

  for (const terminal of terminals) {
    const terminalAttempt = attemptIdOf(terminal.event);
    const terminalTs = eventTime(terminal.event);
    const candidate = runnings.find((r) => {
      if (usedRunning.has(r.event.eventId)) return false;
      if (eventTime(r.event) > terminalTs) return false;
      const runningAttempt = attemptIdOf(r.event);
      if (terminalAttempt !== undefined) {
        return runningAttempt === terminalAttempt;
      }
      if (runningAttempt !== undefined) {
        // Complete rows often omit attempt metadata; pair with the prior unmatched attempt.
        return true;
      }
      return true;
    });
    if (candidate) {
      usedRunning.add(candidate.event.eventId);
      out.push(joinOnePair(candidate, terminal));
    } else {
      out.push({
        ...terminal,
        children: presentSiblingNodes(terminal.children),
      });
    }
  }

  for (const running of runnings) {
    if (usedRunning.has(running.event.eventId)) continue;
    out.push({
      ...running,
      children: presentSiblingNodes(running.children),
    });
  }

  for (const other of others) {
    out.push({
      ...other,
      children: presentSiblingNodes(other.children),
    });
  }

  return out;
}

function presentSiblingNodes(nodes: InspectNode[]): InspectNode[] {
  const prepared = nodes.map((n) => ({
    ...cloneNode(n),
    children: presentSiblingNodes(n.children),
  }));

  const order: string[] = [];
  const groups = new Map<string, InspectNode[]>();
  for (const node of prepared) {
    const key = lifecycleKey(node.event);
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key)!.push(node);
  }

  const out: InspectNode[] = [];
  for (const key of order) {
    out.push(...joinSiblingGroup(groups.get(key)!));
  }
  return out;
}

/**
 * Clone a run tree for display so completed start/complete sibling pairs show
 * one joined status. Original events remain untouched. Distinct attempts that
 * share a stepId remain separate presentation nodes.
 */
export function presentLifecycleJoinedTree(tree: InspectRunTree): InspectRunTree {
  return {
    ...tree,
    children: presentSiblingNodes(tree.children),
    metadata: {
      ...tree.metadata,
      confidenceBreakdown: { ...tree.metadata.confidenceBreakdown },
      kinds: { ...tree.metadata.kinds },
      ...(tree.metadata.relationshipSummary !== undefined
        ? { relationshipSummary: { ...tree.metadata.relationshipSummary } }
        : {}),
    },
  };
}
