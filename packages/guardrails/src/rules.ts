import { redact, type RedactionFinding } from "@agent-inspect/redact";

import type {
  BannedPhraseOptions,
  GuardrailEvidence,
  GuardrailResult,
  OversizeOutputOptions,
  PiiLeakOptions,
  PromptInjectionOptions,
  RequiredJsonShapeOptions,
  StructuredOutputOptions,
  UnsafeToolArgsOptions,
} from "./types.js";

const DEFAULT_INJECTION_PATTERNS = [
  "ignore previous instructions",
  "ignore all prior",
  "disregard your instructions",
  "system prompt",
  "you are now",
  "jailbreak",
] as const;

function pass(ruleId: string, message: string): GuardrailResult {
  return { ruleId, status: "pass", severity: "info", message, evidence: [] };
}

function fail(
  ruleId: string,
  message: string,
  evidence: GuardrailEvidence[],
  severity: "error" | "warning" = "error",
): GuardrailResult {
  return { ruleId, status: severity === "warning" ? "warn" : "fail", severity, message, evidence };
}

function boundedPreview(value: string, max = 80): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 3)}...`;
}

export function evaluateBannedPhrase(
  text: string,
  options: BannedPhraseOptions,
): GuardrailResult {
  const ruleId = "guardrail.banned-phrase";
  const haystack = options.caseInsensitive !== false ? text.toLowerCase() : text;
  const evidence: GuardrailEvidence[] = [];
  for (const phrase of options.phrases) {
    const needle = options.caseInsensitive !== false ? phrase.toLowerCase() : phrase;
    if (needle.length > 0 && haystack.includes(needle)) {
      evidence.push({ ruleId, match: phrase, preview: boundedPreview(text) });
    }
  }
  if (evidence.length === 0) {
    return pass(ruleId, "No banned phrases matched.");
  }
  return fail(ruleId, `Matched ${evidence.length} banned phrase(s).`, evidence);
}

const SEVERITY_RANK = { info: 0, warning: 1, error: 2 } as const;

export function evaluatePiiLeak(value: unknown, options: PiiLeakOptions = {}): GuardrailResult {
  const ruleId = "guardrail.pii-leak";
  const minSeverity = options.minSeverity ?? "warning";
  const result = redact(value, { profile: options.profile ?? "share", collectFindings: true });
  const findings = result.findings.filter(
    (finding: RedactionFinding) => SEVERITY_RANK[finding.severity] >= SEVERITY_RANK[minSeverity],
  );
  if (findings.length === 0) {
    return pass(ruleId, "No PII-style redaction findings.");
  }
  const evidence: GuardrailEvidence[] = findings.map((finding) => ({
    ruleId,
    path: finding.path,
    detector: finding.detector,
    preview: finding.preview,
  }));
  return fail(ruleId, `Detected ${findings.length} PII-style finding(s).`, evidence);
}

function measureDepth(value: unknown): number {
  if (value === null || typeof value !== "object") return 0;
  if (Array.isArray(value)) {
    return 1 + Math.max(0, ...value.map((item) => measureDepth(item)));
  }
  const depths = Object.values(value as Record<string, unknown>).map((item) => measureDepth(item));
  return 1 + (depths.length === 0 ? 0 : Math.max(...depths));
}

function maxStringLength(value: unknown): number {
  if (typeof value === "string") return value.length;
  if (value === null || typeof value !== "object") return 0;
  if (Array.isArray(value)) {
    return Math.max(0, ...value.map((item) => maxStringLength(item)));
  }
  return Math.max(0, ...Object.values(value as Record<string, unknown>).map((item) => maxStringLength(item)));
}

export function evaluateUnsafeToolArgs(
  toolName: string,
  toolArgs: unknown,
  options: UnsafeToolArgsOptions = {},
): GuardrailResult {
  const ruleId = "guardrail.unsafe-tool-args";
  const blocked = new Set((options.blockedTools ?? []).map((name) => name.toLowerCase()));
  const evidence: GuardrailEvidence[] = [];
  if (blocked.has(toolName.toLowerCase())) {
    evidence.push({ ruleId, preview: toolName, match: toolName });
  }
  const maxDepth = options.maxDepth ?? 12;
  const depth = measureDepth(toolArgs);
  if (depth > maxDepth) {
    evidence.push({ ruleId, path: "args", preview: `depth=${depth}` });
  }
  const maxLen = options.maxStringLength ?? 16_384;
  const longest = maxStringLength(toolArgs);
  if (longest > maxLen) {
    evidence.push({ ruleId, path: "args", preview: `maxStringLength=${longest}` });
  }
  if (evidence.length === 0) {
    return pass(ruleId, "Tool arguments within configured bounds.");
  }
  return fail(ruleId, "Unsafe or oversized tool arguments detected.", evidence);
}

export function evaluatePromptInjection(
  text: string,
  options: PromptInjectionOptions = {},
): GuardrailResult {
  const ruleId = "guardrail.prompt-injection";
  const patterns = options.patterns ?? DEFAULT_INJECTION_PATTERNS;
  const haystack = text.toLowerCase();
  const evidence: GuardrailEvidence[] = [];
  for (const pattern of patterns) {
    const needle = pattern.toLowerCase();
    if (needle.length > 0 && haystack.includes(needle)) {
      evidence.push({ ruleId, match: pattern, preview: boundedPreview(text) });
    }
  }
  if (evidence.length === 0) {
    return pass(ruleId, "No prompt-injection patterns matched.");
  }
  return fail(ruleId, `Matched ${evidence.length} injection pattern(s).`, evidence, "warning");
}

function validateSchemaField(
  value: unknown,
  field: StructuredOutputOptions["schema"][string],
  path: string,
  evidence: GuardrailEvidence[],
): void {
  const ruleId = "guardrail.structured-output";
  if (field.type) {
    const actual =
      value === null
        ? "null"
        : Array.isArray(value)
          ? "array"
          : typeof value;
    if (actual !== field.type) {
      evidence.push({ ruleId, path, preview: `expected ${field.type}, got ${actual}` });
      return;
    }
  }
  if (field.enum && !field.enum.some((item) => Object.is(item, value))) {
    evidence.push({ ruleId, path, preview: "value not in enum" });
  }
  if (field.type === "object" && field.required && value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    for (const key of field.required) {
      if (!(key in record)) {
        evidence.push({ ruleId, path: `${path}.${key}`, preview: "missing required key" });
      }
    }
  }
}

export function evaluateStructuredOutput(
  value: unknown,
  options: StructuredOutputOptions,
): GuardrailResult {
  const ruleId = "guardrail.structured-output";
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fail(ruleId, "Structured output must be an object.", [
      { ruleId, preview: typeof value },
    ]);
  }
  const record = value as Record<string, unknown>;
  const evidence: GuardrailEvidence[] = [];
  for (const [key, field] of Object.entries(options.schema)) {
    validateSchemaField(record[key], field, key, evidence);
  }
  if (evidence.length === 0) {
    return pass(ruleId, "Structured output matches schema subset.");
  }
  return fail(ruleId, "Structured output schema violation.", evidence);
}

export function evaluateOversizeOutput(
  value: unknown,
  options: OversizeOutputOptions = {},
): GuardrailResult {
  const ruleId = "guardrail.oversize-output";
  const text = typeof value === "string" ? value : JSON.stringify(value);
  const maxLength = options.maxLength ?? options.maxSerializedLength ?? 32_768;
  if (text.length <= maxLength) {
    return pass(ruleId, "Output within size limits.");
  }
  return fail(ruleId, `Output exceeds max length (${text.length} > ${maxLength}).`, [
    { ruleId, preview: `length=${text.length}` },
  ]);
}

export function evaluateRequiredJsonShape(
  value: unknown,
  options: RequiredJsonShapeOptions,
): GuardrailResult {
  const ruleId = "guardrail.required-json-shape";
  let parsed: unknown = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      return fail(ruleId, "Value is not valid JSON.", [{ ruleId, preview: boundedPreview(value) }]);
    }
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return fail(ruleId, "JSON value must be an object.", [{ ruleId, preview: typeof parsed }]);
  }
  const record = parsed as Record<string, unknown>;
  const evidence: GuardrailEvidence[] = [];
  for (const key of options.requiredKeys) {
    if (!(key in record)) {
      evidence.push({ ruleId, path: key, preview: "missing required key" });
    }
  }
  if (evidence.length === 0) {
    return pass(ruleId, "Required JSON keys present.");
  }
  return fail(ruleId, "Missing required JSON keys.", evidence);
}
