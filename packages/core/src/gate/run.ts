import path from "node:path";

import { runSuite } from "../suite/run.js";
import type { GateCheckResult, GateExitCode, GateResult, RunGateOptions } from "./types.js";
import { checksFromSuiteResult, evaluateGateThresholds, gateHasThresholds } from "./evaluate.js";

function resolveExitCode(input: {
  ok: boolean;
  configError: boolean;
  readError: boolean;
}): GateExitCode {
  if (input.configError) return 2;
  if (input.readError) return 3;
  if (!input.ok) return 1;
  return 0;
}

function validateOptions(options: RunGateOptions): string[] {
  const errors: string[] = [];
  const hasSuite = options.suitePath !== undefined && options.suitePath.trim() !== "";
  const hasThresholds = gateHasThresholds(options);

  if (!hasSuite && !hasThresholds) {
    errors.push(
      "No gate rules specified. Pass --suite or at least one threshold flag.",
    );
  }

  if (hasThresholds && (options.traceDir === undefined || options.traceDir.trim() === "")) {
    if (!hasSuite) {
      errors.push("Threshold flags require --dir <trace-directory>.");
    }
  }

  if (options.maxErrorRate !== undefined && options.maxErrorRate < 0) {
    errors.push("--max-error-rate must be a non-negative percentage.");
  }
  if (options.maxErrorRate !== undefined && options.maxErrorRate > 100) {
    errors.push("--max-error-rate must be at most 100.");
  }

  if (options.maxP95DurationMs !== undefined && options.maxP95DurationMs < 0) {
    errors.push("--max-p95-duration must be a non-negative millisecond value.");
  }

  return errors;
}

function isConfigLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const ext = path.extname(error.message);
  if (error.message.includes("Unsupported suite config extension")) return true;
  if (error.message.includes("TypeScript suite configs require")) return true;
  if (error.message.includes("No suite config found")) return true;
  if (error.message.includes("AI_SUITE_CONFIG")) return true;
  if (ext === ".ts" || ext === ".mts" || ext === ".cts") return true;
  return "diagnostics" in error;
}

export async function runGate(
  runs: readonly import("../sessions/types.js").SessionRunRecord[],
  options: RunGateOptions,
): Promise<GateResult> {
  const diagnostics: string[] = [];
  const checks: GateCheckResult[] = [];

  const validationErrors = validateOptions(options);
  if (validationErrors.length > 0) {
    return {
      ok: false,
      exitCode: 2,
      runCount: 0,
      checks,
      diagnostics: validationErrors,
    };
  }

  let traceDir = options.traceDir?.trim();
  let suiteResult: GateResult["suiteResult"];

  if (options.suitePath !== undefined && options.suitePath.trim() !== "") {
    try {
      suiteResult = await runSuite({
        configPath: options.suitePath,
        cwd: options.cwd,
      });
      traceDir = traceDir ?? suiteResult.tracesDir;
      checks.push(...checksFromSuiteResult(suiteResult));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      diagnostics.push(message);
      return {
        ok: false,
        exitCode: isConfigLoadError(error) ? 2 : 3,
        traceDir,
        suitePath: options.suitePath,
        runCount: 0,
        checks,
        diagnostics,
      };
    }
  }

  if (gateHasThresholds(options)) {
    const thresholdDir = traceDir;
    if (thresholdDir === undefined || thresholdDir.trim() === "") {
      return {
        ok: false,
        exitCode: 2,
        traceDir,
        suitePath: options.suitePath,
        runCount: runs.length,
        checks,
        diagnostics: ["Threshold evaluation requires a trace directory."],
        ...(suiteResult !== undefined ? { suiteResult } : {}),
      };
    }

    const thresholdRuns = runs.length > 0 ? runs : [];
    const { checks: thresholdChecks, readErrors } = await evaluateGateThresholds(
      thresholdRuns,
      options,
    );
    checks.push(...thresholdChecks);
    diagnostics.push(...readErrors);

    if (readErrors.length > 0) {
      const ok = checks.length > 0 && checks.every((item) => item.ok);
      return {
        ok,
        exitCode: resolveExitCode({
          ok,
          configError: false,
          readError: true,
        }),
        traceDir: thresholdDir,
        suitePath: options.suitePath,
        runCount: thresholdRuns.length,
        checks,
        diagnostics,
        ...(suiteResult !== undefined ? { suiteResult } : {}),
      };
    }
  }

  const ok = checks.length > 0 && checks.every((item) => item.ok);
  return {
    ok,
    exitCode: resolveExitCode({ ok, configError: false, readError: false }),
    traceDir,
    suitePath: options.suitePath,
    runCount: runs.length,
    checks,
    diagnostics,
    ...(suiteResult !== undefined ? { suiteResult } : {}),
  };
}
