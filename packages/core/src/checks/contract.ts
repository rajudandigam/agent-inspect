import type {
  TraceCheckEvidence,
  TraceCheckFinding,
  TraceCheckInput,
  TraceCheckResult,
  TraceCheckRule,
} from "./index.js";
import {
  createLlmUsageRule,
  createObservedOutcomeRule,
  createRunDurationRule,
  createRunStatusRule,
  createStructureIncompleteRule,
  createToolOrderingRule,
  createToolUsageRule,
  runTraceChecks,
} from "./index.js";
import { extractOutcomesFromPersistedEvents } from "../outcomes/index.js";

function contractFailFinding(
  ruleId: string,
  message: string,
  evidence: readonly TraceCheckEvidence[],
  expected?: unknown,
  actual?: unknown,
): TraceCheckFinding {
  return {
    ruleId,
    severity: "error",
    status: "fail",
    message,
    ...(expected !== undefined ? { expected } : {}),
    ...(actual !== undefined ? { actual } : {}),
    evidence: [...evidence],
  };
}

/**
 * @experimental Typed trace contract input. Evolves during v6.5.x.
 */
export interface TraceContractRunRules {
  requireCompleted?: boolean;
  allowedStatuses?: string[];
  maxDurationMs?: number;
}

export interface TraceContractToolRules {
  required?: string[];
  forbidden?: string[];
  allowed?: string[];
  maxCalls?: number;
  requiredOrder?: string[];
}

export interface TraceContractLlmRules {
  maxCalls?: number;
  maxTotalTokens?: number;
  allowedModels?: string[];
}

export interface TraceContractObservationRules {
  required?: string[];
  failOn?: Array<"failed" | "unknown" | "skipped">;
}

export interface TraceContractInput {
  run?: TraceContractRunRules;
  tools?: TraceContractToolRules;
  llm?: TraceContractLlmRules;
  observations?: TraceContractObservationRules;
}

export interface TraceContract {
  run?: TraceContractRunRules;
  tools?: TraceContractToolRules;
  llm?: TraceContractLlmRules;
  observations?: TraceContractObservationRules;
}

function normalizeStatus(status: string): "ok" | "error" | "running" {
  if (status === "success") return "ok";
  if (status === "failed") return "error";
  if (status === "running") return "running";
  return "error";
}

function contractToRules(contract: TraceContract): TraceCheckRule[] {
  const rules: TraceCheckRule[] = [];

  if (contract.run?.allowedStatuses?.length === 1) {
    rules.push(
      createRunStatusRule({
        expected: normalizeStatus(contract.run.allowedStatuses[0]!),
        allowIncomplete: contract.run.requireCompleted === false,
      }),
    );
  } else if (contract.run?.requireCompleted !== false) {
    rules.push(createRunStatusRule({ allowIncomplete: false }));
  }

  if (contract.run?.maxDurationMs !== undefined) {
    rules.push(createRunDurationRule({ maxDurationMs: contract.run.maxDurationMs }));
  }

  if (contract.run?.requireCompleted === true) {
    rules.push(createStructureIncompleteRule({ requireEndedAtForStarted: true }));
  }

  if (contract.tools) {
    rules.push(
      createToolUsageRule({
        ...(contract.tools.required ? { required: contract.tools.required } : {}),
        ...(contract.tools.forbidden ? { forbidden: contract.tools.forbidden } : {}),
        ...(contract.tools.allowed ? { allowed: contract.tools.allowed } : {}),
        ...(contract.tools.maxCalls !== undefined ? { maxCount: contract.tools.maxCalls } : {}),
      }),
    );
    const order = contract.tools.requiredOrder ?? [];
    for (let i = 0; i < order.length - 1; i += 1) {
      rules.push(createToolOrderingRule({ before: order[i]!, after: order[i + 1]! }));
    }
  }

  if (contract.llm) {
    rules.push(
      createLlmUsageRule({
        ...(contract.llm.maxCalls !== undefined ? { maxCalls: contract.llm.maxCalls } : {}),
        ...(contract.llm.maxTotalTokens !== undefined
          ? { maxTotalTokens: contract.llm.maxTotalTokens }
          : {}),
        ...(contract.llm.allowedModels ? { allowedModels: contract.llm.allowedModels } : {}),
      }),
    );
  }

  if (contract.observations) {
    const required = contract.observations.required ?? [];
    if (required.length > 0) {
      rules.push({
        id: "contract.observation.required",
        category: "run",
        defaultSeverity: "error",
        evaluate(context) {
          const outcomes = extractOutcomesFromPersistedEvents(context.events);
          const names = new Set(outcomes.map((item) => item.name));
          const missing = required.filter((name) => !names.has(name));
          if (missing.length === 0) return [];
          return [
            contractFailFinding(
              "contract.observation.required",
              `Required observations missing: ${missing.join(", ")}`,
              context.selectedRun
                ? [{ runId: context.selectedRun.runId, kind: "RUN", name: context.selectedRun.name }]
                : [],
              required,
              [...names],
            ),
          ];
        },
      });
    }
    if (contract.observations.failOn?.length) {
      rules.push(
        createObservedOutcomeRule({
          failOn: contract.observations.failOn.filter(
            (status): status is "failed" | "unknown" | "skipped" =>
              status === "failed" || status === "unknown" || status === "skipped",
          ),
        }),
      );
    }
  }

  return rules;
}

/**
 * Define a normalized trace contract object.
 *
 * @experimental
 */
export function defineTraceContract(input: TraceContractInput): TraceContract {
  return {
    ...(input.run ? { run: { ...input.run } } : {}),
    ...(input.tools ? { tools: { ...input.tools } } : {}),
    ...(input.llm ? { llm: { ...input.llm } } : {}),
    ...(input.observations ? { observations: { ...input.observations } } : {}),
  };
}

/**
 * Evaluate a trace contract against an opened trace read result.
 *
 * @experimental
 */
export function evaluateTraceContract(
  input: TraceCheckInput,
  contract: TraceContract,
  options: { runId?: string } = {},
): TraceCheckResult {
  const rules = contractToRules(contract);
  return runTraceChecks(input, {
    rules,
    ...(options.runId !== undefined ? { runId: options.runId } : {}),
  });
}
