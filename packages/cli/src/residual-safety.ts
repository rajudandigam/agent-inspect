import { openTrace } from "@agent-inspect/core/readers";
import type { RedactionProfile } from "@agent-inspect/redact";

import { redactValueWithPolicy } from "./redact-content.js";
import type { CompiledRedactionPolicy } from "./redaction-policy.js";
import { assessOpenedTrace } from "./safety.js";

/**
 * Residual safety assessment for a redacted artifact (experimental, 6.18+).
 *
 * `redact` produces a derived copy; it never certifies that the copy is safe to share.
 * This assessment reports what the canonical local safety pipeline still finds in the
 * redacted output so operators know whether `verify-safe` will flag it.
 */
export type ResidualSafetyStatus = "SAFE" | "SAFE_WITH_WARNINGS" | "UNSAFE" | "UNKNOWN";

/**
 * How the assessment was produced.
 *
 * - `supported-trace` — the redacted output re-opened as a trace and ran the full local
 *   safety pipeline (same rules as `verify-safe`).
 * - `detector-only` — arbitrary JSON/JSONL that is not a supported trace; only redaction
 *   detectors could run, so context-sensitive rules (raw content, oversized attributes)
 *   were not evaluated.
 * - `unavailable` — the redacted output could not be assessed at all.
 */
export type ResidualSafetyBasis = "supported-trace" | "detector-only" | "unavailable";

export interface ResidualSafetyAssessment {
  status: ResidualSafetyStatus;
  basis: ResidualSafetyBasis;
  findingCount: number;
  highConfidenceFindingCount: number;
  /** Sorted, de-duplicated rule/detector identifiers. Never contains matched values. */
  codes: string[];
  note: string;
}

export interface ResidualSafetyOptions {
  profile: RedactionProfile;
  policy?: CompiledRedactionPolicy;
}

const SUPPORTED_TRACE_NOTE =
  "Best-effort local residual assessment of the redacted copy; not a certification that sharing is safe.";
const DETECTOR_ONLY_NOTE =
  "Input is not a supported trace; only redaction detectors ran. Context-sensitive rules were not evaluated.";
const UNAVAILABLE_NOTE = "Redacted output could not be assessed locally.";

function sortedCodes(codes: Iterable<string>): string[] {
  return [...new Set(codes)].sort((a, b) => a.localeCompare(b));
}

function assessmentFromSafetyResult(
  result: ReturnType<typeof assessOpenedTrace>,
): ResidualSafetyAssessment {
  const status: ResidualSafetyStatus =
    result.status === "SAFE WITH WARNINGS" ? "SAFE_WITH_WARNINGS" : result.status;
  const highConfidence = result.findings.filter((finding) =>
    finding.confidence === undefined ? finding.severity === "error" : finding.confidence === "high",
  ).length;
  return {
    status,
    basis: "supported-trace",
    findingCount: result.findings.length,
    highConfidenceFindingCount: highConfidence,
    codes: sortedCodes([
      ...result.findings.map((finding) => finding.detector ?? finding.ruleId),
      ...result.diagnostics
        .filter((diagnostic) => diagnostic.severity !== "info")
        .map((diagnostic) => diagnostic.code),
    ]),
    note: SUPPORTED_TRACE_NOTE,
  };
}

function parseDocuments(content: string): unknown[] {
  const trimmed = content.trim();
  if (trimmed === "") return [];
  try {
    return [JSON.parse(trimmed) as unknown];
  } catch {
    // fall through to JSONL
  }
  return content
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "")
    .map((line) => JSON.parse(line) as unknown);
}

function detectorOnlyAssessment(
  content: string,
  options: ResidualSafetyOptions,
): ResidualSafetyAssessment {
  const documents = parseDocuments(content);
  const codes: string[] = [];
  let findingCount = 0;
  let highConfidenceFindingCount = 0;
  let unsafe = false;
  let warned = false;

  for (const document of documents) {
    const pass = redactValueWithPolicy(document, options.profile, options.policy);
    for (const finding of pass.findings) {
      // Key rules re-match the already-replaced placeholder; only value-level residue counts.
      if (finding.action === "keep" || finding.matchKind === "key") continue;
      findingCount += 1;
      codes.push(finding.detector);
      if (finding.severity === "error") {
        highConfidenceFindingCount += 1;
        unsafe = true;
      } else if (finding.severity === "warning") {
        warned = true;
      }
    }
  }

  return {
    status: unsafe ? "UNSAFE" : warned ? "SAFE_WITH_WARNINGS" : "SAFE",
    basis: "detector-only",
    findingCount,
    highConfidenceFindingCount,
    codes: sortedCodes(codes),
    note: `${SUPPORTED_TRACE_NOTE} ${DETECTOR_ONLY_NOTE}`,
  };
}

/** Assesses the redacted copy. Local only; never throws into the redact command. */
export async function assessResidualSafety(
  redactedContent: string,
  options: ResidualSafetyOptions,
): Promise<ResidualSafetyAssessment> {
  try {
    const read = await openTrace(
      { type: "string", content: redactedContent },
      { format: "agent-inspect-jsonl" },
    );
    const result = assessOpenedTrace(read, {
      redactionProfile: options.profile,
      ...(options.policy !== undefined ? { policy: options.policy } : {}),
    });
    return assessmentFromSafetyResult(result);
  } catch {
    // Not a supported trace (plain JSON, foreign schema, empty output).
  }

  try {
    return detectorOnlyAssessment(redactedContent, options);
  } catch {
    return {
      status: "UNKNOWN",
      basis: "unavailable",
      findingCount: 0,
      highConfidenceFindingCount: 0,
      codes: [],
      note: `${SUPPORTED_TRACE_NOTE} ${UNAVAILABLE_NOTE}`,
    };
  }
}

/**
 * Concise, value-free human warning.
 *
 * Only `UNSAFE` and `UNKNOWN` warn on stderr: a redacted copy routinely keeps warning-level
 * findings (a sensitive key name whose value is now a placeholder), and warning on those
 * would make the default human path noisy. JSON output always carries the full assessment.
 */
export function residualWarningLine(
  assessment: ResidualSafetyAssessment,
): string | undefined {
  if (assessment.status !== "UNSAFE" && assessment.status !== "UNKNOWN") return undefined;
  const codes = assessment.codes.length > 0 ? ` Codes: ${assessment.codes.join(", ")}.` : "";
  return (
    `Residual safety: ${assessment.status} (${assessment.basis}) — ` +
    `${assessment.findingCount} finding(s), ${assessment.highConfidenceFindingCount} high-confidence, ` +
    `remain in the redacted copy. Run \`agent-inspect verify-safe\` before sharing.${codes}`
  );
}

/** Exit code contract for `--fail-on-residual`. Default redact exit codes are unchanged. */
export function residualExitCode(assessment: ResidualSafetyAssessment): number {
  if (assessment.status === "UNSAFE") return 1;
  if (assessment.status === "UNKNOWN") return 2;
  return 0;
}
