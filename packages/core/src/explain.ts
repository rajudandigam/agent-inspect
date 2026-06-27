import { Redactor } from "./logs/redactor.js";
import { resolveRedactionProfile } from "./redaction-profiles.js";
import type { RedactionProfile } from "./types.js";
import type { InspectNode, InspectRunTree } from "./types/inspect-event.js";

export type ExplainMode = "dry-run" | "local";

export interface ExplainFact {
  id: string;
  label: string;
  value: unknown;
  source: "trace";
  confidence: "observed";
}

export interface ExplainInference {
  id: string;
  label: string;
  text: string;
  evidence: string[];
  confidence: "deterministic";
}

export interface ExplainResult {
  mode: ExplainMode;
  runId: string;
  name?: string;
  status?: string;
  redactionProfile: RedactionProfile;
  facts: ExplainFact[];
  inferences: ExplainInference[];
  notes: string[];
}

export interface ExplainOptions {
  mode?: ExplainMode;
  redactionProfile?: RedactionProfile;
}

interface FlatNode {
  node: InspectNode;
  index: number;
}

function flatten(nodes: InspectNode[], out: FlatNode[] = []): FlatNode[] {
  for (const node of nodes) {
    out.push({ node, index: out.length + 1 });
    flatten(node.children, out);
  }
  return out;
}

function redactValue(
  redactor: Redactor,
  key: string,
  value: unknown,
): unknown {
  return redactor.redactValue(key, value);
}

function fact(
  id: string,
  label: string,
  value: unknown,
  redactor: Redactor,
): ExplainFact {
  return {
    id,
    label,
    value: redactValue(redactor, id.split(".").at(-1) ?? id, value),
    source: "trace",
    confidence: "observed",
  };
}

function topKinds(run: InspectRunTree): string[] {
  return Object.entries(run.metadata.kinds)
    .filter(([, count]) => count > 0)
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    })
    .slice(0, 5)
    .map(([kind, count]) => `${kind}:${count}`);
}

function countErrorNodes(nodes: FlatNode[]): number {
  return nodes.filter((entry) => entry.node.event.status === "error").length;
}

function slowestNode(nodes: FlatNode[]): FlatNode | undefined {
  return nodes
    .filter((entry) => entry.node.event.durationMs !== undefined)
    .sort((a, b) => {
      const delta = (b.node.event.durationMs ?? 0) - (a.node.event.durationMs ?? 0);
      return delta !== 0 ? delta : a.index - b.index;
    })[0];
}

function attributeFacts(nodes: FlatNode[], redactor: Redactor): ExplainFact[] {
  const facts: ExplainFact[] = [];
  for (const entry of nodes) {
    const attrs = entry.node.event.attributes;
    if (attrs === undefined) continue;
    for (const key of Object.keys(attrs).sort()) {
      facts.push({
        id: `node.${entry.index}.attributes.${key}`,
        label: `${entry.node.event.name} attribute ${key}`,
        value: redactValue(redactor, key, attrs[key]),
        source: "trace",
        confidence: "observed",
      });
      if (facts.length >= 8) return facts;
    }
  }
  return facts;
}

function buildFacts(run: InspectRunTree, redactor: Redactor): ExplainFact[] {
  const nodes = flatten(run.children);
  const facts = [
    fact("run.id", "Run id", run.runId, redactor),
    fact("run.name", "Run name", run.name ?? run.runId, redactor),
    fact("run.status", "Run status", run.status ?? "unknown", redactor),
    fact("run.totalEvents", "Total events", run.metadata.totalEvents, redactor),
    fact("run.stepCount", "Top-level step count", run.children.length, redactor),
    fact("run.nodeCount", "Total node count", nodes.length, redactor),
    fact("run.errorNodeCount", "Error node count", countErrorNodes(nodes), redactor),
    fact("run.kinds", "Observed kind mix", topKinds(run), redactor),
  ];
  if (run.durationMs !== undefined) {
    facts.push(fact("run.durationMs", "Run duration milliseconds", run.durationMs, redactor));
  }
  const slowest = slowestNode(nodes);
  if (slowest !== undefined) {
    facts.push(
      fact("run.slowestNode", "Slowest observed node", {
        name: slowest.node.event.name,
        kind: slowest.node.event.kind,
        durationMs: slowest.node.event.durationMs,
      }, redactor),
    );
  }
  facts.push(...attributeFacts(nodes, redactor));
  return facts;
}

function buildInferences(run: InspectRunTree, facts: ExplainFact[]): ExplainInference[] {
  const inferences: ExplainInference[] = [];
  const errorFact = facts.find((item) => item.id === "run.errorNodeCount");
  const kindFact = facts.find((item) => item.id === "run.kinds");
  const durationFact = facts.find((item) => item.id === "run.durationMs");
  const errorNodeCount =
    typeof errorFact?.value === "number" ? errorFact.value : 0;

  if (run.status === "error" || errorNodeCount > 0) {
    inferences.push({
      id: "outcome.error",
      label: "Outcome",
      text: "The run recorded an error status or at least one error node.",
      evidence: ["run.status", "run.errorNodeCount"],
      confidence: "deterministic",
    });
  } else if (run.status === "ok") {
    inferences.push({
      id: "outcome.success",
      label: "Outcome",
      text: "The run completed without observed error nodes.",
      evidence: ["run.status", "run.errorNodeCount"],
      confidence: "deterministic",
    });
  }

  if (kindFact !== undefined) {
    inferences.push({
      id: "shape.kind-mix",
      label: "Trace shape",
      text: "The explanation is based on the observed event kind mix, not generated content.",
      evidence: [kindFact.id],
      confidence: "deterministic",
    });
  }

  if (durationFact !== undefined) {
    inferences.push({
      id: "timing.duration",
      label: "Timing",
      text: "Timing claims are limited to persisted duration fields in the trace.",
      evidence: [durationFact.id],
      confidence: "deterministic",
    });
  }

  return inferences;
}

/**
 * Build a local, deterministic explanation payload from a reader-selected run.
 *
 * This helper performs no network I/O and does not call a model provider.
 */
export function buildLocalExplanation(
  run: InspectRunTree,
  options: ExplainOptions = {},
): ExplainResult {
  const redactionProfile = options.redactionProfile ?? "local";
  const resolved = resolveRedactionProfile(redactionProfile);
  const redactor = new Redactor({ extraKeys: resolved.extraKeys });
  const mode = options.mode ?? "local";
  const facts = buildFacts(run, redactor);
  return {
    mode,
    runId: String(redactValue(redactor, "runId", run.runId)),
    ...(run.name !== undefined ? { name: String(redactValue(redactor, "name", run.name)) } : {}),
    ...(run.status !== undefined ? { status: run.status } : {}),
    redactionProfile,
    facts,
    inferences: mode === "dry-run" ? [] : buildInferences(run, facts),
    notes: [
      "Generated locally without provider or network calls.",
      "Facts are observed from normalized trace data; inferences are deterministic labels.",
    ],
  };
}
