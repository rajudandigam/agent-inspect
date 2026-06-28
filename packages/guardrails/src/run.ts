import {
  evaluateBannedPhrase,
  evaluateOversizeOutput,
  evaluatePiiLeak,
  evaluatePromptInjection,
  evaluateRequiredJsonShape,
  evaluateStructuredOutput,
  evaluateUnsafeToolArgs,
} from "./rules.js";
import type {
  GuardrailInput,
  GuardrailResult,
  GuardrailRuleId,
  GuardrailRunResult,
  RunGuardrailsOptions,
} from "./types.js";

const ALL_RULES: GuardrailRuleId[] = [
  "guardrail.banned-phrase",
  "guardrail.pii-leak",
  "guardrail.unsafe-tool-args",
  "guardrail.prompt-injection",
  "guardrail.structured-output",
  "guardrail.oversize-output",
  "guardrail.required-json-shape",
];

function isErrorFailure(result: GuardrailResult): boolean {
  return result.status === "fail" && result.severity === "error";
}

function runRule(ruleId: GuardrailRuleId, input: GuardrailInput, options: RunGuardrailsOptions): GuardrailResult | undefined {
  switch (ruleId) {
    case "guardrail.banned-phrase": {
      if (!options.bannedPhrase || input.text === undefined) return undefined;
      return evaluateBannedPhrase(input.text, options.bannedPhrase);
    }
    case "guardrail.pii-leak": {
      if (input.value === undefined && input.text === undefined) return undefined;
      return evaluatePiiLeak(input.value ?? input.text, options.piiLeak);
    }
    case "guardrail.unsafe-tool-args": {
      if (!input.toolName) return undefined;
      return evaluateUnsafeToolArgs(input.toolName, input.toolArgs ?? {}, options.unsafeToolArgs);
    }
    case "guardrail.prompt-injection": {
      if (input.text === undefined) return undefined;
      return evaluatePromptInjection(input.text, options.promptInjection);
    }
    case "guardrail.structured-output": {
      if (!options.structuredOutput || input.value === undefined) return undefined;
      return evaluateStructuredOutput(input.value, options.structuredOutput);
    }
    case "guardrail.oversize-output": {
      if (input.value === undefined && input.text === undefined) return undefined;
      return evaluateOversizeOutput(input.value ?? input.text, options.oversizeOutput);
    }
    case "guardrail.required-json-shape": {
      if (!options.requiredJsonShape || (input.value === undefined && input.text === undefined)) return undefined;
      return evaluateRequiredJsonShape(input.value ?? input.text!, options.requiredJsonShape);
    }
    default:
      return undefined;
  }
}

export function runGuardrails(input: GuardrailInput, options: RunGuardrailsOptions = {}): GuardrailRunResult {
  const selected = options.rules ?? ALL_RULES;
  const results: GuardrailResult[] = [];
  for (const ruleId of selected) {
    const result = runRule(ruleId, input, options);
    if (result) results.push(result);
  }
  const ok = !results.some(isErrorFailure);
  return { ok, results };
}

export { ALL_RULES as DEFAULT_GUARDRAIL_RULES };
