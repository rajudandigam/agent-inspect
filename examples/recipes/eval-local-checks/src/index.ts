import {
  checks,
  evalRun,
  renderEvalMarkdown,
} from "@agent-inspect/eval";
import type { TraceReadResult } from "agent-inspect/readers";

const runId = "eval-local-checks";
const read: TraceReadResult = {
  format: "agent-inspect-jsonl",
  sourceFiles: ["inline-rag-fixture"],
  warnings: [],
  unsupportedFields: [],
  events: [],
  runs: [
    {
      runId,
      name: "local rag eval fixture",
      status: "ok",
      startedAt: 1,
      endedAt: 2,
      durationMs: 100,
      children: [
        {
          depth: 1,
          event: {
            eventId: "retrieve",
            runId,
            parentId: "run",
            kind: "TOOL",
            name: "searchDocs",
            timestamp: 1,
            status: "ok",
            confidence: "explicit",
            source: { type: "manual" },
            attributes: {
              documents: [
                {
                  id: "policy-30-day",
                  text: "Refunds are available within 30 days when the receipt is present.",
                },
              ],
              sourceIds: ["policy-30-day"],
            },
          },
          children: [],
        },
        {
          depth: 1,
          event: {
            eventId: "answer",
            runId,
            parentId: "run",
            kind: "LLM",
            name: "generateAnswer",
            timestamp: 2,
            status: "ok",
            confidence: "explicit",
            source: { type: "manual" },
            attributes: {
              answer:
                "Refunds are available within 30 days with a receipt [policy-30-day].",
              citations: ["policy-30-day"],
            },
          },
          children: [],
        },
      ],
      metadata: {
        totalEvents: 2,
        confidenceBreakdown: {
          explicit: 2,
          correlated: 0,
          heuristic: 0,
          unknown: 0,
        },
        kinds: {
          RUN: 0,
          AGENT: 0,
          LLM: 1,
          TOOL: 1,
          CHAIN: 0,
          RETRIEVER: 0,
          DECISION: 0,
          RESULT: 0,
          ERROR: 0,
          LOGIC: 0,
          LOG: 0,
          OUTCOME: 0,
        },
      },
    },
  ],
};

const result = await evalRun(read, {
  checks: [
    checks.requireSuccess(),
    checks.requiredTools(["searchDocs"]),
    checks.contextOverlap({ minOverlap: 0.2 }),
    checks.citationPresence(),
    checks.requiredSourceIds(["policy-30-day"]),
    checks.answerLengthBounds({ minWords: 6, maxWords: 30 }),
    checks.bannedUnsupportedPhrases(),
  ],
});

const markdown = renderEvalMarkdown(result);

console.log("Local eval checks recipe complete");
console.log(`Eval status: ${result.status}`);
console.log(
  `Findings: ${result.summary.failed} failed, ${result.summary.warnings} warnings`,
);
console.log(`Markdown summary: ${markdown.split("\n").find((line) => line.startsWith("Status:"))}`);
console.log("");
console.log("CLI equivalent:");
console.log(
  "  npx agent-inspect eval trace.jsonl --require-success --required-tool searchDocs --citation-presence --context-overlap --json",
);
