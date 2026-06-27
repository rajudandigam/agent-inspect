import { expect } from "vitest";

import {
  persistedInspectEventsToRunTrees,
  persistedInspectEventsToTraceEvents,
  type PersistedInspectEvent,
  type PersistedTokenUsage,
} from "../src/entries/persisted.js";
import type {
  InspectNode,
  TraceEvent,
} from "../src/entries/advanced.js";
import { openTrace, readTrace } from "../src/readers/index.js";

export function toJsonl(events: readonly unknown[]): string {
  return `${events.map((event) => JSON.stringify(event)).join("\n")}\n`;
}

export function flattenNodes(nodes: readonly InspectNode[]): InspectNode[] {
  return nodes.flatMap((node) => [node, ...flattenNodes(node.children)]);
}

export function expectNoRawStrings(
  adapter: string,
  payload: unknown,
  rawStrings: readonly string[],
): void {
  const serialized = JSON.stringify(payload);
  for (const raw of rawStrings) {
    expect(serialized, `${adapter} persisted raw payload: ${raw}`).not.toContain(raw);
  }
}

export function expectPairedLifecycle(
  adapter: string,
  events: readonly PersistedInspectEvent[],
  kind: PersistedInspectEvent["kind"],
  terminalStatus: "ok" | "error" = "ok",
): {
  started: PersistedInspectEvent;
  completed: PersistedInspectEvent;
} {
  const started = events.find((event) => event.kind === kind && event.status === "running");
  const completed = events.find((event) => event.kind === kind && event.status === terminalStatus);
  expect(started, `${adapter} ${kind} start`).toBeDefined();
  expect(completed, `${adapter} ${kind} ${terminalStatus}`).toBeDefined();
  expect(completed?.eventId, `${adapter} ${kind} lifecycle identity`).toBe(started?.eventId);
  return {
    started: started as PersistedInspectEvent,
    completed: completed as PersistedInspectEvent,
  };
}

export function expectParentedTo(
  adapter: string,
  child: PersistedInspectEvent | undefined,
  parent: PersistedInspectEvent | undefined,
): void {
  expect(child, `${adapter} child event`).toBeDefined();
  expect(parent, `${adapter} parent event`).toBeDefined();
  expect(child?.parentId, `${adapter} parent link`).toBe(parent?.eventId);
}

export function expectTokenUsage(
  adapter: string,
  event: PersistedInspectEvent | undefined,
  usage: PersistedTokenUsage,
): void {
  expect(event?.tokenUsage, `${adapter} token usage`).toEqual(usage);
  expect(JSON.stringify(event?.tokenUsage), `${adapter} token usage cost-free`).not.toMatch(
    /cost/i,
  );
}

export function expectStreamingSummary(
  adapter: string,
  attrs: Record<string, unknown> | undefined,
  expected: { chunkCount: number; streamedCharCount?: number },
): void {
  expect(attrs?.chunkCount, `${adapter} chunk count`).toBe(expected.chunkCount);
  if (expected.streamedCharCount !== undefined) {
    expect(attrs?.streamedCharCount, `${adapter} streamed char count`).toBe(
      expected.streamedCharCount,
    );
  }
  expect(JSON.stringify(attrs), `${adapter} raw token array`).not.toContain('"tokens":[');
}

export async function expectPersistedInspectRoundTrip(
  adapter: string,
  events: readonly PersistedInspectEvent[],
  expectedKinds: readonly PersistedInspectEvent["kind"][],
): Promise<void> {
  expect(events.length, `${adapter} event count`).toBeGreaterThan(0);
  expect(
    events.every((event) => event.schemaVersion === "0.2"),
    `${adapter} v0.2 schema`,
  ).toBe(true);

  const normalized = persistedInspectEventsToTraceEvents([...events]);
  const trees = persistedInspectEventsToRunTrees([...events]);
  expect(trees, `${adapter} run trees`).toHaveLength(1);
  expect(
    flattenNodes(trees[0]?.children ?? []).map((node) => node.event.kind),
    `${adapter} tree kinds`,
  ).toEqual(expectedKinds);

  const input = { type: "string" as const, content: toJsonl(events) };
  const read = await readTrace(input, { format: "agent-inspect-jsonl" });
  const opened = await openTrace(input, { format: "agent-inspect-jsonl" });
  expect(read.runs, `${adapter} read/open round trip`).toEqual(opened.runs);
  expect(
    flattenNodes(read.runs[0]?.children ?? []).map((node) => node.event.kind),
    `${adapter} reader kinds`,
  ).toEqual(expectedKinds);
  expect(normalized.length, `${adapter} normalized trace events`).toBeGreaterThan(0);
}

export async function expectTraceEventRoundTrip(
  adapter: string,
  events: readonly TraceEvent[],
  expectedNames: readonly string[],
): Promise<void> {
  const input = { type: "string" as const, content: toJsonl(events) };
  const read = await readTrace(input, { format: "agent-inspect-jsonl" });
  const opened = await openTrace(input, { format: "agent-inspect-jsonl" });
  expect(read.runs, `${adapter} v0.1 read/open round trip`).toEqual(opened.runs);
  const nodes = flattenNodes(read.runs[0]?.children ?? []);
  const names = nodes.map((node) => node.event.name);
  for (const expectedName of expectedNames) {
    expect(names, `${adapter} reader names`).toContain(expectedName);
  }
}
