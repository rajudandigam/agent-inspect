import { access } from "node:fs/promises";
import path from "node:path";

import type {
  SuiteCaseConfig,
  SuiteConfig,
  SuiteDiagnostic,
  ValidateSuiteConfigResult,
} from "./types.js";

function diagnostic(
  code: SuiteDiagnostic["code"],
  message: string,
  severity: SuiteDiagnostic["severity"] = "error",
  caseId?: string,
): SuiteDiagnostic {
  return { code, message, severity, ...(caseId !== undefined ? { caseId } : {}) };
}

function asString(value: unknown, label: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} must be a non-empty string.`);
  }
  return value.trim();
}

function asStringArray(value: unknown, label: string): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`${label} must be an array of strings.`);
  }
  return value;
}

function asPositiveNumber(value: unknown, label: string): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a non-negative number.`);
  }
  return value;
}

function validateCaseConfig(
  value: unknown,
  index: number,
): { caseConfig?: SuiteCaseConfig; diagnostics: SuiteDiagnostic[] } {
  const diagnostics: SuiteDiagnostic[] = [];
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    diagnostics.push(
      diagnostic("AI_SUITE_CONFIG_INVALID", `cases[${index}] must be an object.`),
    );
    return { diagnostics };
  }

  const raw = value as Record<string, unknown>;
  try {
    const id = asString(raw.id, `cases[${index}].id`);
    if (id === undefined) {
      diagnostics.push(
        diagnostic("AI_SUITE_CONFIG_INVALID", `cases[${index}].id is required.`),
      );
      return { diagnostics };
    }

    const trace = asString(raw.trace, `cases[${index}].trace`);
    const runId = asString(raw.runId, `cases[${index}].runId`);
    const input = asString(raw.input, `cases[${index}].input`);

    return {
      caseConfig: {
        id,
        ...(trace !== undefined ? { trace } : {}),
        ...(runId !== undefined ? { runId } : {}),
        ...(input !== undefined ? { input } : {}),
        ...(asStringArray(raw.requireTools, `cases[${index}].requireTools`) !== undefined
          ? { requireTools: asStringArray(raw.requireTools, `cases[${index}].requireTools`) }
          : {}),
        ...(asStringArray(raw.forbidTools, `cases[${index}].forbidTools`) !== undefined
          ? { forbidTools: asStringArray(raw.forbidTools, `cases[${index}].forbidTools`) }
          : {}),
        ...(asPositiveNumber(raw.maxDurationMs, `cases[${index}].maxDurationMs`) !== undefined
          ? {
              maxDurationMs: asPositiveNumber(
                raw.maxDurationMs,
                `cases[${index}].maxDurationMs`,
              ),
            }
          : {}),
        ...(asStringArray(
          raw.expectedObservations,
          `cases[${index}].expectedObservations`,
        ) !== undefined
          ? {
              expectedObservations: asStringArray(
                raw.expectedObservations,
                `cases[${index}].expectedObservations`,
              ),
            }
          : {}),
      },
      diagnostics,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    diagnostics.push(diagnostic("AI_SUITE_CONFIG_INVALID", message));
    return { diagnostics };
  }
}

export function normalizeSuiteConfig(value: unknown): SuiteConfig {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Suite config must export an object.");
  }
  const raw = value as Record<string, unknown>;
  const name = asString(raw.name, "name");
  const traces = asString(raw.traces, "traces");
  if (name === undefined) throw new Error("name is required.");
  if (traces === undefined) throw new Error("traces is required.");

  if (!Array.isArray(raw.cases) || raw.cases.length === 0) {
    throw new Error("cases must be a non-empty array.");
  }

  const cases: SuiteCaseConfig[] = [];
  for (let index = 0; index < raw.cases.length; index += 1) {
    const { caseConfig, diagnostics } = validateCaseConfig(raw.cases[index], index);
    if (diagnostics.length > 0) {
      throw new Error(diagnostics.map((item) => item.message).join("; "));
    }
    if (caseConfig !== undefined) cases.push(caseConfig);
  }

  const ids = new Set<string>();
  for (const suiteCase of cases) {
    if (ids.has(suiteCase.id)) {
      throw new Error(`Duplicate case id "${suiteCase.id}".`);
    }
    ids.add(suiteCase.id);
  }

  const redactionProfile =
    raw.redactionProfile === "local" ||
    raw.redactionProfile === "share" ||
    raw.redactionProfile === "strict"
      ? raw.redactionProfile
      : undefined;
  if (
    raw.redactionProfile !== undefined &&
    redactionProfile === undefined
  ) {
    throw new Error('redactionProfile must be "local", "share", or "strict".');
  }

  const config: SuiteConfig = { name, traces, cases };
  if (raw.checks !== undefined) {
    if (typeof raw.checks !== "object" || Array.isArray(raw.checks)) {
      throw new Error("checks must be an object.");
    }
    config.checks = raw.checks as SuiteConfig["checks"];
  }
  if (raw.eval !== undefined) {
    if (typeof raw.eval !== "object" || Array.isArray(raw.eval)) {
      throw new Error("eval must be an object.");
    }
    config.eval = raw.eval as SuiteConfig["eval"];
  }
  if (raw.artifacts !== undefined) {
    if (typeof raw.artifacts !== "object" || Array.isArray(raw.artifacts)) {
      throw new Error("artifacts must be an object.");
    }
    const outputDir = asString(
      (raw.artifacts as Record<string, unknown>).outputDir,
      "artifacts.outputDir",
    );
    config.artifacts = outputDir !== undefined ? { outputDir } : {};
  }
  if (raw.baseline !== undefined) {
    const baseline = asString(raw.baseline, "baseline");
    if (baseline !== undefined) config.baseline = baseline;
  }
  if (raw.candidate !== undefined) {
    const candidate = asString(raw.candidate, "candidate");
    if (candidate !== undefined) config.candidate = candidate;
  }
  if (redactionProfile !== undefined) config.redactionProfile = redactionProfile;
  return config;
}

export async function validateSuiteConfig(
  config: SuiteConfig,
  options: { configDir: string },
): Promise<ValidateSuiteConfigResult> {
  const diagnostics: SuiteDiagnostic[] = [];
  const tracesDir = path.resolve(options.configDir, config.traces);
  try {
    await access(tracesDir);
  } catch {
    diagnostics.push(
      diagnostic("AI_SUITE_CONFIG_INVALID", `traces directory not found: ${tracesDir}`),
    );
  }

  for (const suiteCase of config.cases) {
    if (suiteCase.input !== undefined) {
      const inputPath = path.resolve(options.configDir, suiteCase.input);
      try {
        await access(inputPath);
      } catch {
        diagnostics.push(
          diagnostic(
            "AI_SUITE_CONFIG_INVALID",
            `input fixture not found: ${suiteCase.input}`,
            "warning",
            suiteCase.id,
          ),
        );
      }
    }
  }

  return { ok: diagnostics.every((item) => item.severity !== "error"), diagnostics };
}
