/**
 * A small synthetic AgentInspect trace used by the "Open Sample Trace" command
 * so new users can explore the tree/timeline/report views without capturing a
 * run first. Fully synthetic — no real prompts, tools, or data.
 */

export const SAMPLE_TRACE_RUN_ID = "agent-inspect-sample";
export const SAMPLE_TRACE_FILENAME = "agent-inspect-sample.jsonl";

const BASE = 1_700_000_000_000;

/** Returns the sample trace as AgentInspect v0.1 JSONL (one event per line). */
export function buildSampleTrace(): string {
  const rows: Record<string, unknown>[] = [
    {
      schemaVersion: "0.1",
      event: "run_started",
      timestamp: BASE,
      runId: SAMPLE_TRACE_RUN_ID,
      name: "sample-support-agent",
      startTime: BASE,
    },
    {
      schemaVersion: "0.1",
      event: "step_started",
      timestamp: BASE + 10,
      runId: SAMPLE_TRACE_RUN_ID,
      stepId: "llm_001",
      name: "llm:plan",
      type: "llm",
      startTime: BASE + 10,
      metadata: { model: "sample-model" },
    },
    {
      schemaVersion: "0.1",
      event: "step_completed",
      timestamp: BASE + 210,
      runId: SAMPLE_TRACE_RUN_ID,
      stepId: "llm_001",
      status: "success",
      endTime: BASE + 210,
      durationMs: 200,
    },
    {
      schemaVersion: "0.1",
      event: "step_started",
      timestamp: BASE + 220,
      runId: SAMPLE_TRACE_RUN_ID,
      stepId: "tool_001",
      name: "tool:lookup-order",
      type: "tool",
      startTime: BASE + 220,
      metadata: { toolName: "lookup_order", inputPreview: '{"orderId":"A-1"}' },
    },
    {
      schemaVersion: "0.1",
      event: "step_completed",
      timestamp: BASE + 320,
      runId: SAMPLE_TRACE_RUN_ID,
      stepId: "tool_001",
      status: "success",
      endTime: BASE + 320,
      durationMs: 100,
    },
    {
      schemaVersion: "0.1",
      event: "run_completed",
      timestamp: BASE + 330,
      runId: SAMPLE_TRACE_RUN_ID,
      status: "success",
      endTime: BASE + 330,
      durationMs: 330,
    },
  ];
  return rows.map((row) => JSON.stringify(row)).join("\n") + "\n";
}
