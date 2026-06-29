import type { PersistedInspectEvent } from "agent-inspect/persisted";

export interface InspectNodeLike {
  event: { kind: string };
  children: InspectNodeLike[];
}

export function eventsToJsonl(events: readonly unknown[]): string {
  return `${events.map((event) => JSON.stringify(event)).join("\n")}\n`;
}

export function flattenInspectNodes(nodes: readonly InspectNodeLike[]): InspectNodeLike[] {
  return nodes.flatMap((node) => [node, ...flattenInspectNodes(node.children)]);
}

export function extractPersistedKinds(
  events: readonly PersistedInspectEvent[],
): PersistedInspectEvent["kind"][] {
  return events.map((event) => event.kind);
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(sortJson(value)) ?? "null";
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sortJson(item));
  }
  if (isPlainRecord(value)) {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) {
      sorted[key] = sortJson(value[key]);
    }
    return sorted;
  }
  return value === undefined ? null : value;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
