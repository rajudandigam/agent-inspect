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
import type { TraceReadResult } from "../readers/index.js";

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
  /**
   * Unconditional tool presence invariant. Every named tool must appear at least
   * once. Do not use for cache-hit or alternate-path shortcuts — prefer
   * `observations.required` until `alternatives.anyOf` ships (planned 6.20.0).
   *
   * @see docs/TRACE-CONTRACTS.md
   */
  required?: string[];
  /** Alias of `required` (TraceContract v2 normalization). */
  requiredTools?: string[];
  forbidden?: string[];
  /** Alias of `forbidden`. */
  forbiddenTools?: string[];
  allowed?: string[];
  maxCalls?: number;
  /**
   * Required tool order expanded into adjacent pairs.
   *
   * `[A, B, C]` expands to “A before B” and “B before C”, each comparing the
   * selected `requiredOrderMode` to every pair. Unlisted intermediate tools
   * are allowed.
   *
   * TraceContract `requiredOrder` **implies presence**: every listed name is
   * added to the effective required-tool set. Low-level `createToolOrderingRule`
   * alone may still pass vacuously when an endpoint is missing.
   *
   * The default `first-occurrence` mode preserves first-occurrence encounter
   * ordering; overlapping intervals emit a non-failing warning. `happens-before`
   * requires the first before event to finish before the first after event starts.
   * `all-occurrences` applies that causal boundary to every occurrence.
   *
   * @see docs/TRACE-CONTRACTS.md
   * @beta Available through `agent-inspect/checks`. Additive changes may ship
   * in minor releases; breaking changes require a future major.
   */
  requiredOrder?: string[];
  /**
   * Ordering semantics applied to every adjacent pair in `requiredOrder`.
   * Causal modes fail closed when a required interval boundary is unavailable.
   *
   * @defaultValue `"first-occurrence"`
   * @beta Available through `agent-inspect/checks`.
   */
  requiredOrderMode?: "first-occurrence" | "happens-before" | "all-occurrences";
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
  if (status === "ok" || status === "error" || status === "running") return status;
  if (status === "success") return "ok";
  if (status === "failed") return "error";
  return "error";
}

function contractToRules(contract: TraceContract): TraceCheckRule[] {
  const rules: TraceCheckRule[] = [];

  const allowedStatuses = contract.run?.allowedStatuses ?? [];
  if (allowedStatuses.length === 1) {
    rules.push(
      createRunStatusRule({
        expected: normalizeStatus(allowedStatuses[0]!),
        allowIncomplete: contract.run?.requireCompleted === false,
      }),
    );
  } else if (allowedStatuses.length > 1) {
    const expected = [...new Set(allowedStatuses.map(normalizeStatus))];
    const allowIncomplete = contract.run?.requireCompleted === false;
    rules.push({
      id: "contract.run.allowedStatuses",
      category: "run",
      defaultSeverity: "error",
      evaluate(context) {
        const findings: TraceCheckFinding[] = [];
        const actual = context.selectedRun?.status ?? "unknown";
        if (!expected.includes(actual as "ok" | "error" | "running")) {
          findings.push(
            contractFailFinding(
              "contract.run.allowedStatuses",
              `Run status ${actual} is not one of the allowed statuses: ${expected.join(", ")}.`,
              context.selectedRun
                ? [
                    {
                      runId: context.selectedRun.runId,
                      kind: "RUN",
                      name: context.selectedRun.name,
                      status: context.selectedRun.status,
                    },
                  ]
                : [],
              expected,
              actual,
            ),
          );
        }
        if (!allowIncomplete) {
          const running = (context.logicalEvents ?? context.events).filter(
            (event) => event.status === "running",
          );
          if (running.length > 0) {
            findings.push(
              contractFailFinding(
                "contract.run.allowedStatuses",
                "Run contains incomplete running events.",
                running.map((event) => ({
                  runId: event.runId,
                  eventId: event.eventId,
                  kind: event.kind,
                  name: event.name,
                  status: event.status,
                })),
                "no running events",
                running.length,
              ),
            );
          }
        }
        return findings;
      },
    });
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
    const order = contract.tools.requiredOrder ?? [];
    const requiredOrderMode = contract.tools.requiredOrderMode ?? "first-occurrence";
    const required = [
      ...new Set([
        ...(contract.tools.required ?? []),
        ...(contract.tools.requiredTools ?? []),
        ...order,
      ]),
    ];
    const forbidden = [
      ...(contract.tools.forbidden ?? []),
      ...(contract.tools.forbiddenTools ?? []),
    ];
    rules.push(
      createToolUsageRule({
        ...(required.length > 0 ? { required } : {}),
        ...(forbidden.length > 0 ? { forbidden } : {}),
        ...(contract.tools.allowed ? { allowed: contract.tools.allowed } : {}),
        ...(contract.tools.maxCalls !== undefined ? { maxCount: contract.tools.maxCalls } : {}),
      }),
    );
    for (let i = 0; i < order.length - 1; i += 1) {
      rules.push(
        createToolOrderingRule({
          before: order[i]!,
          after: order[i + 1]!,
          id: `contract.tool.order.${i}`,
          mode: requiredOrderMode,
        }),
      );
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

/**
 * Convenience: evaluate a contract against a TraceReadResult directly.
 *
 * @experimental Additive wrapper over `evaluateTraceContract({ read }, …)`.
 */
export function evaluateTraceContractRead(
  read: TraceReadResult,
  contract: TraceContract,
  options: { runId?: string } = {},
): TraceCheckResult {
  return evaluateTraceContract({ read }, contract, options);
}
