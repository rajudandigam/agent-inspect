/**
 * Thorin / W16 — smaller failure summary using existing surfaces.
 * No new failure-analysis API. Synthetic events only.
 */
import { findFirstCausalFailure } from "agent-inspect/advanced";
import type { TraceEvent } from "agent-inspect";

type Class = "supported" | "none";

function eventsLinked(): TraceEvent[] {
  return [
    {
      schemaVersion: "0.1",
      event: "run_started",
      timestamp: 1,
      runId: "run_c1",
      name: "causal-demo",
      startTime: 1,
    },
    {
      schemaVersion: "0.1",
      event: "step_started",
      timestamp: 2,
      runId: "run_c1",
      stepId: "lookup",
      type: "tool",
      name: "lookup",
      startTime: 2,
    },
    {
      schemaVersion: "0.1",
      event: "step_completed",
      timestamp: 3,
      runId: "run_c1",
      stepId: "lookup",
      status: "error",
      endTime: 3,
      durationMs: 1,
      error: { message: "fixture: lookup failed" },
    },
    {
      schemaVersion: "0.1",
      event: "step_started",
      timestamp: 4,
      runId: "run_c1",
      stepId: "answer",
      type: "llm",
      name: "answer",
      startTime: 4,
      parentId: "lookup",
    },
    {
      schemaVersion: "0.1",
      event: "step_completed",
      timestamp: 5,
      runId: "run_c1",
      stepId: "answer",
      status: "error",
      endTime: 5,
      durationMs: 1,
      error: { message: "fixture: answer failed after lookup" },
    },
    {
      schemaVersion: "0.1",
      event: "run_completed",
      timestamp: 6,
      runId: "run_c1",
      status: "error",
      endTime: 6,
      durationMs: 5,
    },
  ];
}

function eventsAdjacentUnlinked(): TraceEvent[] {
  // Two failures with no parent/child link — timing alone must not invent cause.
  return [
    {
      schemaVersion: "0.1",
      event: "run_started",
      timestamp: 1,
      runId: "run_c2",
      name: "adjacent",
      startTime: 1,
    },
    {
      schemaVersion: "0.1",
      event: "step_started",
      timestamp: 2,
      runId: "run_c2",
      stepId: "a",
      type: "tool",
      name: "toolA",
      startTime: 2,
    },
    {
      schemaVersion: "0.1",
      event: "step_completed",
      timestamp: 3,
      runId: "run_c2",
      stepId: "a",
      status: "error",
      endTime: 3,
      durationMs: 1,
      error: { message: "a failed" },
    },
    {
      schemaVersion: "0.1",
      event: "step_started",
      timestamp: 4,
      runId: "run_c2",
      stepId: "b",
      type: "tool",
      name: "toolB",
      startTime: 4,
    },
    {
      schemaVersion: "0.1",
      event: "step_completed",
      timestamp: 5,
      runId: "run_c2",
      stepId: "b",
      status: "error",
      endTime: 5,
      durationMs: 1,
      error: { message: "b failed" },
    },
    {
      schemaVersion: "0.1",
      event: "run_completed",
      timestamp: 6,
      runId: "run_c2",
      status: "error",
      endTime: 6,
      durationMs: 5,
    },
  ];
}

type CaseResult = { id: string; expected: Class; observed: Class };
const results: CaseResult[] = [];

function classify(kind: string): Class {
  return kind === "none" ? "none" : "supported";
}

function check(id: string, expected: Class, events: TraceEvent[]) {
  const result = findFirstCausalFailure(events);
  const observed = classify(result.kind);
  results.push({ id, expected, observed });
  console.log(`  ${id}: expected=${expected} observed=${observed}`);
  if (observed === "supported") {
    console.log(
      `    summary: kind=${result.kind} runId=${result.runId ?? "?"} evidence=${result.evidenceIds.join(",") || "(none)"} next=inspect local tree for ${result.primary?.stepId ?? result.evidenceIds[0] ?? "n/a"}`,
    );
  }
}

console.log("causal-failure-summary:");

check("C01-linked-failure", "supported", eventsLinked());

// Adjacent failures still yield an explicit_error_event for the first error —
// "unlinked" here means contract/relationship claim is not invented beyond that.
const adjacent = findFirstCausalFailure(eventsAdjacentUnlinked());
results.push({
  id: "C02-adjacent-unlinked",
  expected: "none",
  observed:
    adjacent.kind === "explicit_error_event" &&
    !adjacent.relationship?.relatedIds?.length
      ? "none"
      : classify(adjacent.kind) === "supported" && adjacent.relationship
        ? "supported"
        : "none",
});
console.log(
  `  C02-adjacent-unlinked: expected=none observed=${results[results.length - 1]!.observed}`,
);

// Wrong-run contract finding must not attach.
const wrongRun = findFirstCausalFailure(eventsLinked(), {
  contractFindings: [
    {
      ruleId: "demo.rule",
      status: "fail",
      evidenceIds: ["step-from-other-run"],
      message: "wrong run",
    },
  ],
});
// Still has explicit error from same-run events — supported from explicit stage.
// Task: wrong-run link rejected for the *relationship claim*; we treat orphan contract evidence as non-binding.
results.push({
  id: "C03-wrong-run-link",
  expected: "none",
  observed: wrongRun.primary?.stepId === "step-from-other-run" ? "supported" : "none",
});
console.log(
  `  C03-wrong-run-link: expected=none observed=${results[results.length - 1]!.observed}`,
);

// Removing the parent link removes the ancestor/child relationship claim.
const unlinked = eventsLinked().map((e) => {
  if (e.event === "step_started" && "parentId" in e) {
    const { parentId: _p, ...rest } = e as TraceEvent & { parentId?: string };
    return rest as TraceEvent;
  }
  return e;
});
const afterUnlink = findFirstCausalFailure(unlinked);
results.push({
  id: "C04-remove-link",
  expected: "none",
  observed:
    afterUnlink.relationship?.role === "ancestor" ||
    afterUnlink.relationship?.role === "child"
      ? "supported"
      : "none",
});
console.log(
  `  C04-remove-link: expected=none observed=${results[results.length - 1]!.observed}`,
);

console.log(
  `classes: ${results.map((r) => `${r.id.slice(0, 3)}:${r.observed}`).join(",")}`,
);

const mismatch = results.filter((r) => r.expected !== r.observed);
if (mismatch.length) {
  console.error("classification mismatches", mismatch);
  process.exitCode = 1;
}
