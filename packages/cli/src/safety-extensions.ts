import {
  runCircuits,
  type CircuitResult,
  type CircuitRuleId,
  type CircuitTraceEvent,
  type RunCircuitsOptions,
} from "@agent-inspect/circuit";
import {
  runGuardrails,
  type GuardrailResult,
  type GuardrailRuleId,
  type RunGuardrailsOptions,
} from "@agent-inspect/guardrails";
import type {
  TraceCheckEvidence,
  TraceCheckFinding,
  TraceCheckResult,
  TraceCheckSeverity,
} from "@agent-inspect/core/checks";
import type { TraceReadResult } from "@agent-inspect/core/readers";

const GUARDRAIL_ALIASES: Record<string, GuardrailRuleId> = {
  "banned-phrase": "guardrail.banned-phrase",
  "pii-leak": "guardrail.pii-leak",
  "unsafe-tool-args": "guardrail.unsafe-tool-args",
  "prompt-injection": "guardrail.prompt-injection",
  "structured-output": "guardrail.structured-output",
  "oversize-output": "guardrail.oversize-output",
  "required-json-shape": "guardrail.required-json-shape",
};

const CIRCUIT_ALIASES: Record<string, CircuitRuleId> = {
  "same-tool-repetition": "circuit.same-tool-repetition",
  "same-args-repetition": "circuit.same-args-repetition",
  "max-loop-iterations": "circuit.max-loop-iterations",
  "max-retries": "circuit.max-retries",
  "tool-timeout": "circuit.tool-timeout",
  "runaway-llm-loop": "circuit.runaway-llm-loop",
  "excessive-branch-width": "circuit.excessive-branch-width",
};

export function parseGuardrailRules(values: readonly string[] | undefined): GuardrailRuleId[] | undefined {
  if (!values?.length) return undefined;
  return values.map((value) => {
    const rule = GUARDRAIL_ALIASES[value] ?? (value as GuardrailRuleId);
    return rule;
  });
}

export function parseCircuitRules(values: readonly string[] | undefined): CircuitRuleId[] | undefined {
  if (!values?.length) return undefined;
  return values.map((value) => {
    const rule = CIRCUIT_ALIASES[value] ?? (value as CircuitRuleId);
    return rule;
  });
}

function toSeverity(severity: "error" | "warning" | "info"): TraceCheckSeverity {
  return severity;
}

function guardrailFinding(result: GuardrailResult): TraceCheckFinding {
  return {
    ruleId: result.ruleId,
    severity: toSeverity(result.severity),
    status: result.status === "pass" ? "pass" : result.status === "warn" ? "warning" : "fail",
    message: result.message,
    evidence: result.evidence.map(
      (item): TraceCheckEvidence => ({
        path: item.path,
        preview: item.preview,
      }),
    ),
  };
}

function circuitFinding(result: CircuitResult): TraceCheckFinding {
  return {
    ruleId: result.ruleId,
    severity: toSeverity(result.severity),
    status: result.status === "closed" ? "pass" : result.status === "warn" ? "warning" : "fail",
    message: result.message,
    evidence: result.evidence.map(
      (item): TraceCheckEvidence => ({
        runId: item.runId,
        eventId: item.eventId,
        path: item.path,
        name: item.toolName,
      }),
    ),
    actual: result.evidence[0]?.count,
    expected: result.evidence[0]?.threshold,
  };
}

function eventToCircuit(event: TraceReadResult["events"][number]): CircuitTraceEvent {
  return {
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
  };
}

function collectGuardrailInputs(read: TraceReadResult): Array<{
  text?: string;
  value?: unknown;
  toolName?: string;
  toolArgs?: unknown;
}> {
  const inputs: Array<{
    text?: string;
    value?: unknown;
    toolName?: string;
    toolArgs?: unknown;
  }> = [];
  for (const event of read.events) {
    const attrs = event.attributes ?? {};
    for (const key of ["output", "answer", "text", "content", "message"]) {
      const value = attrs[key];
      if (typeof value === "string") inputs.push({ text: value });
      else if (value !== undefined) inputs.push({ value });
    }
    if (event.kind === "tool" || event.name.startsWith("tool:")) {
      inputs.push({
        toolName: String(attrs.toolName ?? attrs.tool ?? event.name),
        toolArgs: attrs.arguments ?? attrs.args ?? attrs.input,
      });
    }
  }
  return inputs;
}

const DEFAULT_GUARDRAIL_OPTIONS: RunGuardrailsOptions = {
  bannedPhrase: { phrases: ["delete all data", "ignore all instructions"] },
  promptInjection: {},
  piiLeak: { profile: "share" },
};

const DEFAULT_CIRCUIT_OPTIONS: RunCircuitsOptions = {
  sameToolRepetition: { maxRepeats: 3 },
  sameArgsRepetition: { maxRepeats: 2 },
  maxLoopIterations: { maxIterations: 20 },
  maxRetries: { maxRetries: 3 },
  toolTimeout: { maxDurationMs: 60_000 },
  runawayLlmLoop: { maxLlmCalls: 12 },
  excessiveBranchWidth: { maxWidth: 8 },
};

export function mergeSafetyExtensions(
  result: TraceCheckResult,
  read: TraceReadResult,
  options: {
    guardrails?: readonly string[];
    circuits?: readonly string[];
  },
): TraceCheckResult {
  const findings = [...result.findings];
  let failed = result.summary.failed;
  let warnings = result.summary.warnings;
  let passed = result.summary.passed;

  const guardrailRules = parseGuardrailRules(options.guardrails);
  if (guardrailRules) {
    for (const input of collectGuardrailInputs(read)) {
      const run = runGuardrails(input, {
        ...DEFAULT_GUARDRAIL_OPTIONS,
        rules: guardrailRules,
      });
      for (const item of run.results) {
        const finding = guardrailFinding(item);
        findings.push(finding);
        if (finding.status === "fail") failed += 1;
        else if (finding.status === "warning") warnings += 1;
        else passed += 1;
      }
    }
  }

  const circuitRules = parseCircuitRules(options.circuits);
  if (circuitRules) {
    const circuitRun = runCircuits(
      read.events.map(eventToCircuit),
      { ...DEFAULT_CIRCUIT_OPTIONS, rules: circuitRules },
    );
    for (const item of circuitRun.results) {
      const finding = circuitFinding(item);
      findings.push(finding);
      if (finding.status === "fail") failed += 1;
      else if (finding.status === "warning") warnings += 1;
      else passed += 1;
    }
  }

  const ok = failed === 0 && result.summary.errors === 0;
  return {
    ...result,
    ok,
    status: failed > 0 ? "fail" : warnings > 0 ? "warning" : result.status,
    summary: {
      passed,
      failed,
      warnings,
      errors: result.summary.errors,
    },
    findings,
  };
}
