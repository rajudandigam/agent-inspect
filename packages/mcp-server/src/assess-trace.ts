import {
  createSafetyOversizedAttributeRule,
  createSafetyRawContentRule,
  createSafetyRedactionRule,
  createSafetySecretPatternRule,
  runTraceChecks,
  type TraceCheckFinding,
} from "agent-inspect/checks";
import type { openTrace } from "agent-inspect/readers";

const DEFAULT_MAX_STRING_LENGTH = 16_384;
const DEFAULT_MAX_ARRAY_LENGTH = 1_000;
const DEFAULT_MAX_OBJECT_KEYS = 200;
const DEFAULT_MAX_SERIALIZED_BYTES = 128 * 1024;

function buildMcpSafetyRules() {
  return [
    createSafetyRawContentRule(),
    createSafetyRedactionRule(),
    createSafetySecretPatternRule(),
    createSafetyOversizedAttributeRule({
      maxStringLength: DEFAULT_MAX_STRING_LENGTH,
      maxArrayLength: DEFAULT_MAX_ARRAY_LENGTH,
      maxObjectKeys: DEFAULT_MAX_OBJECT_KEYS,
      maxSerializedBytes: DEFAULT_MAX_SERIALIZED_BYTES,
    }),
  ];
}

export type McpTraceSafetyStatus =
  | "SAFE"
  | "SAFE WITH WARNINGS"
  | "UNSAFE"
  | "UNKNOWN";

export interface McpTraceSafetyAssessment {
  status: McpTraceSafetyStatus;
  errors: number;
  warnings: number;
  findings: number;
}

function statusFrom(
  findings: readonly TraceCheckFinding[],
  hasErrors: boolean,
): McpTraceSafetyStatus {
  if (hasErrors) return "UNKNOWN";
  if (findings.some((item) => item.severity === "error")) return "UNSAFE";
  if (findings.some((item) => item.severity === "warning")) return "SAFE WITH WARNINGS";
  return "SAFE";
}

/**
 * Assess trace safety for MCP bundle metadata (mirrors CLI verify-safe rules).
 */
export function assessTraceForMcp(
  read: Awaited<ReturnType<typeof openTrace>>,
  runId: string,
): McpTraceSafetyAssessment {
  const rules = buildMcpSafetyRules();
  const checkResult = runTraceChecks({ read }, { rules, runId });
  const hasErrors = checkResult.diagnostics.some((item) => item.severity === "error");
  const status = statusFrom(checkResult.findings, hasErrors);
  return {
    status,
    errors:
      checkResult.diagnostics.filter((item) => item.severity === "error").length +
      checkResult.findings.filter((item) => item.severity === "error").length,
    warnings:
      checkResult.diagnostics.filter((item) => item.severity === "warning").length +
      checkResult.findings.filter((item) => item.severity === "warning").length,
    findings: checkResult.findings.length,
  };
}
