/**
 * Recipe-local RETRIEVER → LLM happens-before rule.
 * Does not extend StepOrderingKind (still TOOL | LLM only).
 */
import type {
  TraceCheckEvidence,
  TraceCheckFinding,
  TraceCheckRule,
} from "agent-inspect/checks";
import type { PersistedInspectEvent } from "agent-inspect/readers";

function evidenceFor(event: PersistedInspectEvent, path?: string): TraceCheckEvidence {
  return {
    runId: event.runId,
    eventId: event.eventId,
    kind: event.kind,
    name: event.name,
    ...(path !== undefined ? { path } : {}),
  };
}

function fail(
  message: string,
  evidence: readonly TraceCheckEvidence[],
  expected?: unknown,
  actual?: unknown,
): TraceCheckFinding {
  return {
    ruleId: "recipe.retriever.before.llm",
    severity: "error",
    status: "fail",
    message,
    evidence: [...evidence],
    ...(expected !== undefined ? { expected } : {}),
    ...(actual !== undefined ? { actual } : {}),
  };
}

function endMs(event: PersistedInspectEvent): number | undefined {
  if (typeof event.endedAt === "string" && event.endedAt.length > 0) {
    const parsed = Date.parse(event.endedAt);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  if (typeof event.durationMs === "number" && typeof event.timestamp === "string") {
    const start = Date.parse(event.timestamp);
    if (Number.isFinite(start)) return start + event.durationMs;
  }
  return undefined;
}

function startMs(event: PersistedInspectEvent): number | undefined {
  if (typeof event.startedAt === "string" && event.startedAt.length > 0) {
    const parsed = Date.parse(event.startedAt);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  if (typeof event.timestamp === "string") {
    const parsed = Date.parse(event.timestamp);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

/**
 * Require at least one finished RETRIEVER whose end is ≤ first finished LLM start
 * in the same run. Unfinished retrievers and missing retrieval fail closed.
 */
export function createRetrieverBeforeLlmRule(): TraceCheckRule {
  return {
    id: "recipe.retriever.before.llm",
    category: "structure",
    defaultSeverity: "error",
    evaluate(context) {
      const events = context.logicalEvents ?? context.events;
      const runId = context.selectedRun?.runId;
      const inRun = (event: PersistedInspectEvent) =>
        runId === undefined || event.runId === runId;

      const retrievers = events.filter(
        (event) => event.kind === "RETRIEVER" && inRun(event),
      );
      const llms = events.filter(
        (event) =>
          event.kind === "LLM" && event.status !== "running" && inRun(event),
      );

      const findings: TraceCheckFinding[] = [];

      const unfinished = retrievers.filter((event) => event.status === "running");
      if (unfinished.length > 0) {
        findings.push(
          fail(
            "RETRIEVER span(s) never finished before LLM check.",
            unfinished.map((event) => evidenceFor(event, "status")),
            "finished RETRIEVER",
            unfinished.map((event) => event.eventId),
          ),
        );
      }

      const finishedRetrievers = retrievers.filter((event) => event.status !== "running");
      if (finishedRetrievers.length === 0) {
        findings.push(
          fail(
            "No finished RETRIEVER evidence in run; generation order cannot be proven.",
            llms.slice(0, 1).map((event) => evidenceFor(event)),
            "RETRIEVER before LLM",
            { retrieverCount: 0, llmCount: llms.length },
          ),
        );
        return findings;
      }

      if (llms.length === 0) {
        // Retrieval without generation is out of scope for this order rule.
        return findings;
      }

      const firstLlm = [...llms].sort((a, b) => {
        const as = startMs(a) ?? Number.POSITIVE_INFINITY;
        const bs = startMs(b) ?? Number.POSITIVE_INFINITY;
        return as - bs || a.eventId.localeCompare(b.eventId);
      })[0]!;
      const llmStart = startMs(firstLlm);
      if (llmStart === undefined) {
        findings.push(
          fail(
            "First LLM span is missing a usable start time.",
            [evidenceFor(firstLlm, "startedAt")],
          ),
        );
        return findings;
      }

      const prior = finishedRetrievers.filter((event) => {
        const end = endMs(event);
        return end !== undefined && end <= llmStart;
      });

      if (prior.length === 0) {
        findings.push(
          fail(
            "No finished RETRIEVER ended at or before the first LLM start (reversed or overlapping order).",
            [
              ...finishedRetrievers.slice(0, 1).map((event) => evidenceFor(event, "endedAt")),
              evidenceFor(firstLlm, "startedAt"),
            ],
            { mode: "happens-before", before: "RETRIEVER", after: "LLM" },
            {
              llmStart,
              retrieverEnds: finishedRetrievers.map((event) => ({
                eventId: event.eventId,
                endedAt: event.endedAt,
              })),
            },
          ),
        );
      }

      return findings;
    },
  };
}
