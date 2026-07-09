import path from "node:path";

import {
  createLlmUsageRule,
  createObservedOutcomeRule,
  createRunDurationRule,
  createRunStatusRule,
  createToolUsageRule,
  runTraceChecks,
  type TraceCheckRule,
} from "../checks/index.js";
import { extractOutcomesFromPersistedEvents, extractOutcomesFromTraceEvents } from "../outcomes/extract.js";
import { openTrace, type TraceReadResult } from "../readers/index.js";
import type { TraceEvent } from "../types.js";
import { loadSuiteConfig } from "./load.js";
import { resolveSuiteCaseTrace } from "./resolve.js";
import type {
  RunSuiteOptions,
  SuiteCaseConfig,
  SuiteCaseResult,
  SuiteConfig,
  SuiteDiagnostic,
  SuiteRunResult,
} from "./types.js";

function diagnostic(
  code: SuiteDiagnostic["code"],
  message: string,
  severity: SuiteDiagnostic["severity"] = "error",
  caseId?: string,
): SuiteDiagnostic {
  return { code, message, severity, ...(caseId !== undefined ? { caseId } : {}) };
}

function buildCaseRules(
  suiteCase: SuiteCaseConfig,
  config: SuiteConfig,
): { rules: TraceCheckRule[]; select: string[] } {
  const rules: TraceCheckRule[] = [];
  const select = new Set<string>(config.checks?.select ?? []);

  if (select.has("run.status")) {
    rules.push(createRunStatusRule());
  }

  const requiredTools = [
    ...(config.checks?.tool?.required ?? []),
    ...(suiteCase.requireTools ?? []),
  ];
  const forbiddenTools = [
    ...(config.checks?.tool?.forbidden ?? []),
    ...(suiteCase.forbidTools ?? []),
  ];
  if (requiredTools.length > 0 || forbiddenTools.length > 0) {
    rules.push(
      createToolUsageRule({
        required: requiredTools.length > 0 ? requiredTools : undefined,
        forbidden: forbiddenTools.length > 0 ? forbiddenTools : undefined,
      }),
    );
    select.add("tool.usage");
  }

  const maxDurationMs =
    suiteCase.maxDurationMs ??
    config.checks?.run?.maxDurationMs ??
    config.eval?.maxDurationMs;
  if (maxDurationMs !== undefined) {
    rules.push(createRunDurationRule({ maxDurationMs }));
    select.add("run.duration");
  }

  const llm = config.checks?.llm;
  if (llm?.allowedModels !== undefined || llm?.maxTotalTokens !== undefined) {
    rules.push(createLlmUsageRule(llm));
    select.add("llm.usage");
  }

  if (select.has("outcome.status")) {
    rules.push(createObservedOutcomeRule({ failOn: ["failed"] }));
  }

  return { rules, select: [...select] };
}

function outcomesFromRead(read: TraceReadResult) {
  const persistedOutcomes = extractOutcomesFromPersistedEvents(
    read.events.filter((event) => event.kind === "OUTCOME"),
  );
  if (persistedOutcomes.length > 0) return persistedOutcomes;

  const traceEvents: TraceEvent[] = [];
  for (const event of read.events) {
    const legacy = event as unknown as TraceEvent;
    if (
      typeof legacy === "object" &&
      legacy !== null &&
      "event" in legacy &&
      legacy.event === "outcome_observed"
    ) {
      traceEvents.push(legacy);
    }
  }
  return traceEvents.length > 0 ? extractOutcomesFromTraceEvents(traceEvents) : [];
}

function validateExpectedObservations(
  suiteCase: SuiteCaseConfig,
  read: TraceReadResult,
): { ok: boolean; diagnostics: SuiteDiagnostic[] } {
  const expected = suiteCase.expectedObservations ?? [];
  if (expected.length === 0) return { ok: true, diagnostics: [] };

  const outcomes = outcomesFromRead(read);

  const diagnostics: SuiteDiagnostic[] = [];
  for (const name of expected) {
    const match = outcomes.find((outcome) => outcome.name === name);
    if (!match) {
      diagnostics.push(
        diagnostic(
          "AI_SUITE_CASE_OBSERVATION_FAILED",
          `Expected observation "${name}" was not recorded.`,
          "error",
          suiteCase.id,
        ),
      );
      continue;
    }
    if (match.status !== "passed") {
      diagnostics.push(
        diagnostic(
          "AI_SUITE_CASE_OBSERVATION_FAILED",
          `Observation "${name}" has status "${match.status}", expected "passed".`,
          "error",
          suiteCase.id,
        ),
      );
    }
  }

  return { ok: diagnostics.length === 0, diagnostics };
}

async function runSuiteCase(
  suiteCase: SuiteCaseConfig,
  config: SuiteConfig,
  options: { configDir: string; tracesDir: string },
): Promise<SuiteCaseResult> {
  const resolved = await resolveSuiteCaseTrace(suiteCase, options);
  if (resolved.missing || resolved.tracePath === undefined) {
    return {
      id: suiteCase.id,
      status: "skipped",
      ...(resolved.runId !== undefined ? { runId: resolved.runId } : {}),
      message: resolved.reason,
      diagnostics: [
        diagnostic(
          "AI_SUITE_CASE_TRACE_MISSING",
          resolved.reason ?? "Trace not found.",
          "warning",
          suiteCase.id,
        ),
      ],
    };
  }

  let read: TraceReadResult;
  try {
    read = await openTrace({ type: "file", path: resolved.tracePath });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      id: suiteCase.id,
      status: "error",
      tracePath: resolved.tracePath,
      ...(resolved.runId !== undefined ? { runId: resolved.runId } : {}),
      message,
      diagnostics: [
        diagnostic("AI_SUITE_TRACE_UNREADABLE", message, "error", suiteCase.id),
      ],
    };
  }

  const { rules, select } = buildCaseRules(suiteCase, config);
  const checkResult =
    rules.length > 0
      ? runTraceChecks({ read }, { rules, select })
      : {
          ok: true,
          status: "pass" as const,
          format: read.format,
          summary: { passed: 0, failed: 0, warnings: 0, errors: 0 },
          findings: [],
          diagnostics: [],
        };
  const observationResult = validateExpectedObservations(suiteCase, read);

  const diagnostics = [
    ...checkResult.diagnostics.map((item) =>
      diagnostic(
        "AI_SUITE_CASE_CHECK_FAILED",
        item.message,
        item.severity,
        suiteCase.id,
      ),
    ),
    ...checkResult.findings
      .filter((finding) => finding.status === "fail")
      .map((finding) =>
        diagnostic(
          "AI_SUITE_CASE_CHECK_FAILED",
          finding.message,
          finding.severity,
          suiteCase.id,
        ),
      ),
    ...observationResult.diagnostics,
  ];

  const checkOk = checkResult.ok;
  const observationsOk = observationResult.ok;
  const ok = checkOk && observationsOk;
  const status = ok ? "pass" : checkResult.status === "error" ? "error" : "fail";

  return {
    id: suiteCase.id,
    status,
    tracePath: resolved.tracePath,
    ...(resolved.runId !== undefined ? { runId: resolved.runId } : {}),
    checkOk,
    observationsOk,
    diagnostics,
    ...(ok
      ? {}
      : {
          message:
            diagnostics.map((item) => item.message).join("; ") ||
            checkResult.findings.map((item) => item.message).join("; "),
        }),
  };
}

export async function runSuite(options: RunSuiteOptions = {}): Promise<SuiteRunResult> {
  const startedAt = new Date(options.nowMs ?? Date.now()).toISOString();
  const { config, configPath, configDir } = await loadSuiteConfig(options);
  const tracesDir = path.resolve(configDir, config.traces);

  const cases: SuiteCaseResult[] = [];
  const diagnostics: SuiteDiagnostic[] = [];

  for (const suiteCase of config.cases) {
    cases.push(
      await runSuiteCase(suiteCase, config, {
        configDir,
        tracesDir,
      }),
    );
  }

  const summary = {
    passed: cases.filter((item) => item.status === "pass").length,
    failed: cases.filter((item) => item.status === "fail").length,
    errors: cases.filter((item) => item.status === "error").length,
    skipped: cases.filter((item) => item.status === "skipped").length,
  };

  const finishedAt = new Date(options.nowMs ?? Date.now()).toISOString();
  const ok = summary.failed === 0 && summary.errors === 0;
  const status =
    summary.errors > 0 ? "error" : summary.failed > 0 || !ok ? "fail" : "pass";

  return {
    ok,
    status,
    suiteName: config.name,
    configPath,
    tracesDir,
    startedAt,
    finishedAt,
    summary,
    cases,
    diagnostics,
  };
}
