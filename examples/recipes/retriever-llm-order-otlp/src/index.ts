/**
 * Illustrative RETRIEVER→LLM order over local OpenInference evidence.
 * StepOrderingKind remains TOOL|LLM — this uses a recipe-local rule only.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { runTraceChecks } from "agent-inspect/checks";
import { openTraceFile } from "agent-inspect/readers";

import { createRetrieverBeforeLlmRule } from "./rule.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(here, "..", "fixtures");

type Expect = "pass" | "fail";

const CASES: Array<{ id: string; file: string; expected: Expect }> = [
  { id: "normal-order", file: "normal-order.json", expected: "pass" },
  { id: "reversed-order", file: "reversed-order.json", expected: "fail" },
  { id: "overlapping-order", file: "overlapping-order.json", expected: "fail" },
  { id: "unfinished-retriever", file: "unfinished-retriever.json", expected: "fail" },
  { id: "missing-retriever", file: "missing-retriever.json", expected: "fail" },
];

const rule = createRetrieverBeforeLlmRule();
const results: Array<{
  id: string;
  expected: Expect;
  observed: string;
  kinds: string[];
  warnings: string[];
}> = [];

console.log("retriever-llm-order-otlp:");
console.log(
  "  note: illustrative OpenInference fixtures; not a native Python AgentInspect adapter",
);
console.log(
  "  honesty: steps.orderRelations kinds are TOOL|LLM only; RETRIEVER preserved as RETRIEVER",
);
console.log(
  "  rule: recipe.retriever.before.llm (recipe-local TraceCheckRule; no RETRIEVER→TOOL relabel)",
);

for (const caseDef of CASES) {
  const fixturePath = path.join(fixturesDir, caseDef.file);
  if (!fs.existsSync(fixturePath)) {
    throw new Error(`missing fixture ${fixturePath}`);
  }
  const read = await openTraceFile(fixturePath);
  const kinds = [
    ...new Set(
      read.events
        .map((event) => event.kind)
        .filter((kind): kind is string => typeof kind === "string"),
    ),
  ].sort();
  const result = runTraceChecks(
    { read, sourceLabel: caseDef.id },
    { rules: [rule] },
  );
  const warnings = read.warnings.map((warning) => warning.code).sort();
  results.push({
    id: caseDef.id,
    expected: caseDef.expected,
    observed: result.status,
    kinds,
    warnings,
  });

  const kindPart = kinds.join(",");
  console.log(
    `  ${caseDef.id}: expected=${caseDef.expected} observed=${result.status} kinds=${kindPart}`,
  );
  if (caseDef.expected !== result.status) {
    throw new Error(
      `${caseDef.id}: expected ${caseDef.expected} but observed ${result.status}`,
    );
  }
  if (caseDef.id !== "missing-retriever" && !kinds.includes("RETRIEVER")) {
    throw new Error(`${caseDef.id}: expected preserved RETRIEVER kind`);
  }
  if (kinds.includes("TOOL") && caseDef.id.includes("retriever")) {
    // Guard against accidental RETRIEVER→TOOL relabel in these fixtures.
    const retrieverAsTool = read.events.some(
      (event) =>
        event.kind === "TOOL" &&
        (event.name.includes("retrieve") ||
          String(event.attributes?.["openinference.span.kind"] ?? "") === "RETRIEVER"),
    );
    if (retrieverAsTool) {
      throw new Error(`${caseDef.id}: RETRIEVER must not be relabeled as TOOL`);
    }
  }
}

console.log(
  `classes: ${results.map((row) => `${row.id}:${row.observed}`).join(",")}`,
);
console.log(
  "  note: order pass does not prove semantic consumption of retrieved content",
);
console.log(
  "  externalValidation: pending real Python LangGraph OTLP export (fixtures labeled illustrative)",
);
