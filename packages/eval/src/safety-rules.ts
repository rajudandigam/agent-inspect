import { runCircuits, type CircuitResult, type CircuitRuleId, type RunCircuitsOptions } from "@agent-inspect/circuit";
import {
  runGuardrails,
  type GuardrailResult,
  type GuardrailRuleId,
  type RunGuardrailsOptions,
} from "@agent-inspect/guardrails";

import type { EvalContext, EvalFinding, EvalRule } from "./index.js";

function pass(ruleId: string, message: string): EvalFinding {
  return { ruleId, status: "pass", severity: "info", message, evidence: [] };
}

function failFinding(
  ruleId: string,
  message: string,
  expected?: unknown,
  actual?: unknown,
): EvalFinding {
  return {
    ruleId,
    status: "fail",
    severity: "error",
    message,
    expected,
    actual,
    evidence: [],
  };
}

function warnFinding(ruleId: string, message: string, actual?: unknown): EvalFinding {
  return {
    ruleId,
    status: "warning",
    severity: "warning",
    message,
    actual,
    evidence: [],
  };
}

function collectAnswerText(context: EvalContext): string {
  const parts: string[] = [];
  for (const node of context.nodes) {
    const attrs = node.event.attributes ?? {};
    for (const key of ["answer", "output", "text", "content"]) {
      const value = attrs[key];
      if (typeof value === "string") parts.push(value);
    }
  }
  return parts.join("\n");
}

export interface EvalGuardrailRuleOptions extends RunGuardrailsOptions {
  rules: readonly GuardrailRuleId[];
}

export interface EvalCircuitRuleOptions extends RunCircuitsOptions {
  rules: readonly CircuitRuleId[];
}

export function createEvalGuardrailRule(options: EvalGuardrailRuleOptions): EvalRule {
  return {
    id: "eval.guardrails",
    category: "safety",
    evaluate(context) {
      const text = collectAnswerText(context);
      const run = runGuardrails({ text, value: context.events }, options);
      return run.results.flatMap((result: GuardrailResult) => {
        if (result.status === "pass") return [pass(result.ruleId, result.message)];
        if (result.status === "warn") return [warnFinding(result.ruleId, result.message)];
        return [failFinding(result.ruleId, result.message)];
      });
    },
  };
}

export function createEvalCircuitRule(options: EvalCircuitRuleOptions): EvalRule {
  return {
    id: "eval.circuits",
    category: "structure",
    evaluate(context) {
      const events = context.events.map((event) => ({
        eventId: event.eventId,
        runId: event.runId,
        name: event.name,
        kind: event.kind,
        parentId: event.parentId,
        startedAt: event.startedAt,
        endedAt: event.endedAt,
        durationMs: event.durationMs,
        attributes: event.attributes,
        status: event.status,
      }));
      const run = runCircuits(events, options);
      return run.results.flatMap((result: CircuitResult) => {
        if (result.status === "closed") return [pass(result.ruleId, result.message)];
        if (result.status === "warn") return [warnFinding(result.ruleId, result.message, result.evidence[0]?.count)];
        return [failFinding(result.ruleId, result.message, result.evidence[0]?.threshold, result.evidence[0]?.count)];
      });
    },
  };
}
