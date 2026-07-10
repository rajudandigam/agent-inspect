import type { PersistedInspectEvent } from "agent-inspect/persisted";

/**
 * Deterministic fake events as a third-party framework might persist them:
 * generic LOGIC kinds and vendor-specific `fakefw.*` attribute conventions
 * (operation name, channel, duration in microseconds) instead of the standard
 * AgentInspect fields. No secrets, no real data.
 */
export function fakeFrameworkEvents(): PersistedInspectEvent[] {
  return [
    {
      schemaVersion: "1.0",
      eventId: "run_1",
      runId: "run_custom_transform",
      kind: "RUN",
      name: "fakefw-session",
      status: "ok",
      timestamp: "2023-11-14T22:13:20.000Z",
      startedAt: "2023-11-14T22:13:20.000Z",
      endedAt: "2023-11-14T22:13:24.000Z",
      durationMs: 4000,
      confidence: "explicit",
      source: { type: "adapter", name: "fake-framework" },
    },
    {
      schemaVersion: "1.0",
      eventId: "call_1",
      runId: "run_custom_transform",
      parentId: "run_1",
      kind: "LOGIC",
      name: "fakefw.call",
      status: "ok",
      timestamp: "2023-11-14T22:13:21.000Z",
      startedAt: "2023-11-14T22:13:21.000Z",
      endedAt: "2023-11-14T22:13:21.250Z",
      confidence: "explicit",
      source: { type: "adapter", name: "fake-framework" },
      attributes: {
        "fakefw.op": "search-flights",
        "fakefw.channel": "tool",
        "fakefw.duration_us": 250000,
      },
    },
    {
      schemaVersion: "1.0",
      eventId: "call_2",
      runId: "run_custom_transform",
      parentId: "run_1",
      kind: "LOGIC",
      name: "fakefw.call",
      status: "ok",
      timestamp: "2023-11-14T22:13:22.000Z",
      startedAt: "2023-11-14T22:13:22.000Z",
      endedAt: "2023-11-14T22:13:23.200Z",
      confidence: "explicit",
      source: { type: "adapter", name: "fake-framework" },
      attributes: {
        "fakefw.op": "draft-reply",
        "fakefw.channel": "llm",
        "fakefw.duration_us": 1200000,
        "fakefw.model": "fixture-model",
      },
    },
    {
      schemaVersion: "1.0",
      eventId: "call_3",
      runId: "run_custom_transform",
      parentId: "run_1",
      kind: "LOGIC",
      name: "fakefw.call",
      status: "ok",
      timestamp: "2023-11-14T22:13:23.500Z",
      startedAt: "2023-11-14T22:13:23.500Z",
      endedAt: "2023-11-14T22:13:23.600Z",
      confidence: "explicit",
      source: { type: "adapter", name: "fake-framework" },
      attributes: {
        "fakefw.op": "emit-metrics",
        "fakefw.channel": "telemetry",
        "fakefw.duration_us": 100000,
      },
    },
  ];
}
