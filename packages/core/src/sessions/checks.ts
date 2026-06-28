import type {
  TraceCheckDiagnostic,
  TraceCheckFinding,
  TraceCheckResult,
  TraceCheckStatus,
  TraceCheckSummary,
} from "../checks/index.js";
import type { SessionWarning } from "./types.js";

export interface TraceSessionCheckResult extends TraceCheckResult {
  scopeKind: "session" | "group";
  scopeLabel: string;
  runIds: string[];
  runResults: Array<{ runId: string; status: TraceCheckStatus }>;
  sessionWarnings?: SessionWarning[];
}

function emptySummary(): TraceCheckSummary {
  return { passed: 0, failed: 0, warnings: 0, errors: 0 };
}

function mergeSummary(
  target: TraceCheckSummary,
  source: TraceCheckSummary,
): TraceCheckSummary {
  return {
    passed: target.passed + source.passed,
    failed: target.failed + source.failed,
    warnings: target.warnings + source.warnings,
    errors: target.errors + source.errors,
  };
}

function sessionDiagnostic(
  code: "AI_CHECK_INVALID_ARGUMENTS" | "AI_CHECK_TRACE_UNREADABLE",
  message: string,
): TraceCheckDiagnostic {
  return { code, message, severity: "error" };
}

/** Aggregates per-run check results for a session or group scope. */
export function aggregateSessionCheckResults(
  perRun: readonly TraceCheckResult[],
  scope: {
    scopeKind: "session" | "group";
    scopeLabel: string;
    runIds: string[];
    sessionWarnings?: SessionWarning[];
    notFound?: boolean;
    empty?: boolean;
  },
): TraceSessionCheckResult {
  if (scope.notFound) {
    return {
      ok: false,
      status: "error",
      format: perRun[0]?.format ?? "agent-inspect-jsonl",
      scopeKind: scope.scopeKind,
      scopeLabel: scope.scopeLabel,
      runIds: [],
      runResults: [],
      summary: { ...emptySummary(), errors: 1 },
      findings: [],
      diagnostics: [
        sessionDiagnostic(
          "AI_CHECK_INVALID_ARGUMENTS",
          `${scope.scopeKind} not found: ${scope.scopeLabel}`,
        ),
      ],
      ...(scope.sessionWarnings?.length
        ? { sessionWarnings: [...scope.sessionWarnings] }
        : {}),
    };
  }

  if (scope.empty || perRun.length === 0) {
    return {
      ok: false,
      status: "error",
      format: perRun[0]?.format ?? "agent-inspect-jsonl",
      scopeKind: scope.scopeKind,
      scopeLabel: scope.scopeLabel,
      runIds: scope.runIds,
      runResults: [],
      summary: { ...emptySummary(), errors: 1 },
      findings: [],
      diagnostics: [
        sessionDiagnostic(
          "AI_CHECK_TRACE_UNREADABLE",
          `No readable traces in ${scope.scopeKind}: ${scope.scopeLabel}`,
        ),
      ],
      ...(scope.sessionWarnings?.length
        ? { sessionWarnings: [...scope.sessionWarnings] }
        : {}),
    };
  }

  let summary = emptySummary();
  const findings: TraceCheckFinding[] = [];
  const diagnostics: TraceCheckDiagnostic[] = [];
  const runResults: Array<{ runId: string; status: TraceCheckStatus }> = [];

  for (const result of perRun) {
    summary = mergeSummary(summary, result.summary);
    findings.push(...result.findings);
    diagnostics.push(...result.diagnostics);
    if (result.runId) {
      runResults.push({ runId: result.runId, status: result.status });
    }
  }

  runResults.sort((a, b) => a.runId.localeCompare(b.runId));
  findings.sort((a, b) => {
    const runCmp = (a.evidence[0]?.runId ?? "").localeCompare(
      b.evidence[0]?.runId ?? "",
    );
    if (runCmp !== 0) return runCmp;
    return a.ruleId.localeCompare(b.ruleId);
  });

  const hasErrors = diagnostics.some((item) => item.severity === "error");
  const status: TraceCheckStatus = hasErrors
    ? "error"
    : summary.failed > 0
      ? "fail"
      : "pass";

  return {
    ok: status === "pass",
    status,
    format: perRun[0]?.format ?? "agent-inspect-jsonl",
    scopeKind: scope.scopeKind,
    scopeLabel: scope.scopeLabel,
    runIds: scope.runIds,
    runResults,
    summary,
    findings,
    diagnostics,
    ...(scope.sessionWarnings?.length
      ? { sessionWarnings: [...scope.sessionWarnings] }
      : {}),
  };
}
