import { createHash } from "node:crypto";

import type {
  CircuitEvidence,
  CircuitResult,
  CircuitRuleId,
  CircuitRunResult,
  CircuitTraceEvent,
  RunCircuitsOptions,
} from "./types.js";

const ALL_RULES: CircuitRuleId[] = [
  "circuit.same-tool-repetition",
  "circuit.same-args-repetition",
  "circuit.max-loop-iterations",
  "circuit.max-retries",
  "circuit.tool-timeout",
  "circuit.runaway-llm-loop",
  "circuit.excessive-branch-width",
];

function closed(ruleId: string, message: string): CircuitResult {
  return { ruleId, status: "closed", severity: "info", message, evidence: [] };
}

function open(
  ruleId: string,
  message: string,
  evidence: CircuitEvidence[],
  severity: "error" | "warning" = "error",
): CircuitResult {
  return {
    ruleId,
    status: severity === "warning" ? "warn" : "open",
    severity,
    message,
    evidence,
  };
}

function isToolEvent(event: CircuitTraceEvent): boolean {
  const name = event.name.toLowerCase();
  return (
    event.kind === "tool" ||
    name.startsWith("tool:") ||
    name.startsWith("function:") ||
    name.includes(".tool.") ||
    name.startsWith("mcp:")
  );
}

function isLlmEvent(event: CircuitTraceEvent): boolean {
  const name = event.name.toLowerCase();
  return event.kind === "llm" || name.startsWith("llm:") || name.includes(".llm.") || name.includes("generation");
}

function toolLabel(event: CircuitTraceEvent): string {
  const attrs = event.attributes ?? {};
  const fromAttr = attrs.toolName ?? attrs.tool ?? attrs.function;
  if (typeof fromAttr === "string" && fromAttr.length > 0) return fromAttr;
  return event.name.replace(/^(tool:|function:|mcp:)/i, "");
}

function argsHash(toolName: string, args: unknown): string {
  return createHash("sha256").update(`${toolName}:${JSON.stringify(args ?? null)}`).digest("hex").slice(0, 16);
}

function toolArgs(event: CircuitTraceEvent): unknown {
  const attrs = event.attributes ?? {};
  return attrs.arguments ?? attrs.args ?? attrs.input ?? attrs.parameters;
}

function durationMs(event: CircuitTraceEvent): number | undefined {
  if (typeof event.durationMs === "number") return event.durationMs;
  const attrs = event.attributes ?? {};
  const fromAttr = attrs.durationMs ?? attrs.duration;
  return typeof fromAttr === "number" ? fromAttr : undefined;
}

function attemptNumber(event: CircuitTraceEvent): number | undefined {
  const attrs = event.attributes ?? {};
  const value = attrs.attempt ?? attrs.retryAttempt ?? attrs.retryCount;
  return typeof value === "number" ? value : undefined;
}

export function evaluateSameToolRepetition(
  events: readonly CircuitTraceEvent[],
  maxRepeats: number,
): CircuitResult {
  const ruleId = "circuit.same-tool-repetition";
  const counts = new Map<string, number>();
  for (const event of events.filter(isToolEvent)) {
    const label = toolLabel(event);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  const evidence: CircuitEvidence[] = [];
  for (const [toolName, count] of counts) {
    if (count > maxRepeats) {
      evidence.push({ ruleId, toolName, count, threshold: maxRepeats });
    }
  }
  if (evidence.length === 0) {
    return closed(ruleId, "Tool repetition within threshold.");
  }
  return open(ruleId, "Same tool repeated beyond threshold.", evidence);
}

export function evaluateSameArgsRepetition(
  events: readonly CircuitTraceEvent[],
  maxRepeats: number,
): CircuitResult {
  const ruleId = "circuit.same-args-repetition";
  const counts = new Map<string, { toolName: string; count: number }>();
  for (const event of events.filter(isToolEvent)) {
    const label = toolLabel(event);
    const hash = argsHash(label, toolArgs(event));
    const key = `${label}:${hash}`;
    const current = counts.get(key) ?? { toolName: label, count: 0 };
    current.count += 1;
    counts.set(key, current);
  }
  const evidence: CircuitEvidence[] = [];
  for (const entry of counts.values()) {
    if (entry.count > maxRepeats) {
      evidence.push({ ruleId, toolName: entry.toolName, count: entry.count, threshold: maxRepeats });
    }
  }
  if (evidence.length === 0) {
    return closed(ruleId, "Tool argument repetition within threshold.");
  }
  return open(ruleId, "Same tool arguments repeated beyond threshold.", evidence);
}

export function evaluateMaxLoopIterations(
  events: readonly CircuitTraceEvent[],
  maxIterations: number,
): CircuitResult {
  const ruleId = "circuit.max-loop-iterations";
  const iterationEvents = events.filter((event) => {
    const attrs = event.attributes ?? {};
    return typeof attrs.iteration === "number" || event.name.toLowerCase().includes("loop");
  });
  const maxSeen = iterationEvents.reduce((max, event) => {
    const attrs = event.attributes ?? {};
    const iteration = typeof attrs.iteration === "number" ? attrs.iteration : max;
    return Math.max(max, iteration);
  }, iterationEvents.length);
  if (maxSeen <= maxIterations) {
    return closed(ruleId, "Loop iterations within threshold.");
  }
  return open(ruleId, "Loop iterations exceeded threshold.", [
    { ruleId, count: maxSeen, threshold: maxIterations },
  ]);
}

export function evaluateMaxRetries(
  events: readonly CircuitTraceEvent[],
  maxRetries: number,
): CircuitResult {
  const ruleId = "circuit.max-retries";
  const attempts = events.map(attemptNumber).filter((value): value is number => value !== undefined);
  const maxAttempt = attempts.length > 0 ? Math.max(...attempts) : 0;
  if (maxAttempt <= maxRetries) {
    return closed(ruleId, "Retry count within threshold.");
  }
  return open(ruleId, "Retry count exceeded threshold.", [
    { ruleId, count: maxAttempt, threshold: maxRetries },
  ]);
}

export function evaluateToolTimeout(
  events: readonly CircuitTraceEvent[],
  maxDurationMs: number,
): CircuitResult {
  const ruleId = "circuit.tool-timeout";
  const evidence: CircuitEvidence[] = [];
  for (const event of events.filter(isToolEvent)) {
    const duration = durationMs(event);
    if (duration !== undefined && duration > maxDurationMs) {
      evidence.push({
        ruleId,
        toolName: toolLabel(event),
        count: duration,
        threshold: maxDurationMs,
        eventId: event.eventId,
      });
    }
  }
  if (evidence.length === 0) {
    return closed(ruleId, "Tool durations within timeout.");
  }
  return open(ruleId, "Tool call exceeded configured timeout.", evidence, "warning");
}

export function evaluateRunawayLlmLoop(
  events: readonly CircuitTraceEvent[],
  maxLlmCalls: number,
): CircuitResult {
  const ruleId = "circuit.runaway-llm-loop";
  const llmCount = events.filter(isLlmEvent).length;
  const hasTerminal = events.some((event) => {
    const status = (event.status ?? event.attributes?.status ?? "").toString().toLowerCase();
    return status === "ok" || status === "success" || status === "completed";
  });
  if (llmCount <= maxLlmCalls || hasTerminal) {
    return closed(ruleId, "LLM call count within threshold or run completed.");
  }
  return open(ruleId, "Runaway LLM loop detected.", [
    { ruleId, count: llmCount, threshold: maxLlmCalls },
  ]);
}

export function evaluateExcessiveBranchWidth(
  events: readonly CircuitTraceEvent[],
  maxWidth: number,
): CircuitResult {
  const ruleId = "circuit.excessive-branch-width";
  const children = new Map<string, number>();
  for (const event of events) {
    const parentId = event.parentId;
    if (!parentId) continue;
    children.set(parentId, (children.get(parentId) ?? 0) + 1);
  }
  const evidence: CircuitEvidence[] = [];
  for (const [parentId, count] of children) {
    if (count > maxWidth) {
      evidence.push({ ruleId, path: parentId, count, threshold: maxWidth });
    }
  }
  if (evidence.length === 0) {
    return closed(ruleId, "Branch width within threshold.");
  }
  return open(ruleId, "Excessive parallel branch width detected.", evidence, "warning");
}

function runRule(
  ruleId: CircuitRuleId,
  events: readonly CircuitTraceEvent[],
  options: RunCircuitsOptions,
): CircuitResult | undefined {
  switch (ruleId) {
    case "circuit.same-tool-repetition":
      if (options.sameToolRepetition === undefined) return undefined;
      return evaluateSameToolRepetition(events, options.sameToolRepetition.maxRepeats);
    case "circuit.same-args-repetition":
      if (options.sameArgsRepetition === undefined) return undefined;
      return evaluateSameArgsRepetition(events, options.sameArgsRepetition.maxRepeats);
    case "circuit.max-loop-iterations":
      if (options.maxLoopIterations === undefined) return undefined;
      return evaluateMaxLoopIterations(events, options.maxLoopIterations.maxIterations);
    case "circuit.max-retries":
      if (options.maxRetries === undefined) return undefined;
      return evaluateMaxRetries(events, options.maxRetries.maxRetries);
    case "circuit.tool-timeout":
      if (options.toolTimeout === undefined) return undefined;
      return evaluateToolTimeout(events, options.toolTimeout.maxDurationMs);
    case "circuit.runaway-llm-loop":
      if (options.runawayLlmLoop === undefined) return undefined;
      return evaluateRunawayLlmLoop(events, options.runawayLlmLoop.maxLlmCalls);
    case "circuit.excessive-branch-width":
      if (options.excessiveBranchWidth === undefined) return undefined;
      return evaluateExcessiveBranchWidth(events, options.excessiveBranchWidth.maxWidth);
    default:
      return undefined;
  }
}

export function runCircuits(
  events: readonly CircuitTraceEvent[],
  options: RunCircuitsOptions = {},
): CircuitRunResult {
  const selected = options.rules ?? ALL_RULES;
  const results: CircuitResult[] = [];
  for (const ruleId of selected) {
    const result = runRule(ruleId, events, options);
    if (result) results.push(result);
  }
  const ok = !results.some((result) => result.status === "open" && result.severity === "error");
  return { ok, results };
}

export { ALL_RULES as DEFAULT_CIRCUIT_RULES };
