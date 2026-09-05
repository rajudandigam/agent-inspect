import { readFile } from "node:fs/promises";
import path from "node:path";

import type { RedactionDetector, RedactionSeverity } from "@agent-inspect/redact";

/** Hard bounds for local CLI redaction policies (#329). */
export const REDACTION_POLICY_LIMITS = {
  maxExtraKeys: 64,
  maxKeyLength: 64,
  maxPatterns: 32,
  maxPatternLength: 128,
  maxPatternIdLength: 64,
  maxTypedQuantifier: 64,
} as const;

export type RedactionPolicyPatternType = "literal" | "prefix" | "typed";

export interface RedactionPolicyPatternInput {
  id?: unknown;
  type?: unknown;
  value?: unknown;
  pattern?: unknown;
  severity?: unknown;
}

export interface RedactionPolicyFile {
  version?: unknown;
  extraKeys?: unknown;
  patterns?: unknown;
}

export interface PolicyDiagnostic {
  code: string;
  message: string;
}

export interface CompiledRedactionPolicy {
  path: string;
  extraKeys: readonly string[];
  detectors: readonly RedactionDetector[];
  diagnostics: readonly PolicyDiagnostic[];
}

const SAFE_TYPED_PATTERN =
  /^[A-Za-z0-9_@./:=<>\-[\]()|+*?{},\\\s^$]+$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function rejectRemotePolicyPath(policyPath: string): void {
  const trimmed = policyPath.trim();
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
    throw new Error(
      `--policy must be a local JSON file path (got a URL-like value). Remote policy fetch is not supported.`,
    );
  }
}

function parseSeverity(value: unknown, label: string): RedactionSeverity {
  if (value === undefined) return "error";
  if (value === "info" || value === "warning" || value === "error") return value;
  throw new Error(`${label} severity must be info, warning, or error.`);
}

function validateExtraKey(key: string, index: number): string {
  const label = `extraKeys[${index}]`;
  if (key.length === 0) throw new Error(`${label} must be a non-empty string.`);
  if (key.length > REDACTION_POLICY_LIMITS.maxKeyLength) {
    throw new Error(
      `${label} exceeds max length ${REDACTION_POLICY_LIMITS.maxKeyLength}.`,
    );
  }
  if (!/^[A-Za-z_][A-Za-z0-9_.-]*$/.test(key)) {
    throw new Error(
      `${label} must be an identifier-like key (letters, digits, _, ., -).`,
    );
  }
  return key;
}

function assertBoundedTypedPattern(pattern: string, label: string): void {
  if (pattern.length === 0) throw new Error(`${label} must be non-empty.`);
  if (pattern.length > REDACTION_POLICY_LIMITS.maxPatternLength) {
    throw new Error(
      `${label} exceeds max length ${REDACTION_POLICY_LIMITS.maxPatternLength}.`,
    );
  }
  if (!SAFE_TYPED_PATTERN.test(pattern)) {
    throw new Error(
      `${label} contains unsupported characters for bounded typed patterns.`,
    );
  }
  // Reject constructs that commonly enable ReDoS or unbounded matching.
  if (/\(\?/.test(pattern) || /\\[1-9]/.test(pattern)) {
    throw new Error(
      `${label} rejects lookaround, backreferences, and nested quantifiers.`,
    );
  }
  // Nested quantifiers: a quantified group that is itself quantified, e.g. (a+)+
  if (/\([^)]*[+*{][^)]*\)[+*{]/.test(pattern) || /\[[^\]]*[+*{][^\]]*\][+*{]/.test(pattern)) {
    throw new Error(`${label} rejects nested quantifiers.`);
  }
  if (/\.[*+]/.test(pattern) || /[*+]\{/.test(pattern)) {
    throw new Error(`${label} rejects unbounded .* / .+ style quantifiers.`);
  }
  for (const match of pattern.matchAll(/\{(\d+)(?:,(\d*))?\}/g)) {
    const min = Number(match[1]);
    const maxRaw = match[2];
    const max = maxRaw === undefined || maxRaw === "" ? min : Number(maxRaw);
    if (
      !Number.isFinite(min) ||
      !Number.isFinite(max) ||
      min > REDACTION_POLICY_LIMITS.maxTypedQuantifier ||
      max > REDACTION_POLICY_LIMITS.maxTypedQuantifier
    ) {
      throw new Error(
        `${label} quantifiers must be <= ${REDACTION_POLICY_LIMITS.maxTypedQuantifier}.`,
      );
    }
  }
}

function compilePatternDetector(
  input: RedactionPolicyPatternInput,
  index: number,
): RedactionDetector {
  const label = `patterns[${index}]`;
  if (!isRecord(input)) throw new Error(`${label} must be an object.`);

  const idRaw = input.id;
  if (typeof idRaw !== "string" || idRaw.trim() === "") {
    throw new Error(`${label}.id must be a non-empty string.`);
  }
  const id = idRaw.trim();
  if (id.length > REDACTION_POLICY_LIMITS.maxPatternIdLength) {
    throw new Error(
      `${label}.id exceeds max length ${REDACTION_POLICY_LIMITS.maxPatternIdLength}.`,
    );
  }
  if (!/^[A-Za-z][A-Za-z0-9._-]*$/.test(id)) {
    throw new Error(`${label}.id must be an identifier-like detector id.`);
  }

  const type = input.type;
  if (type !== "literal" && type !== "prefix" && type !== "typed") {
    throw new Error(`${label}.type must be literal, prefix, or typed.`);
  }

  const severity = parseSeverity(input.severity, label);
  let source: string;
  if (type === "typed") {
    if (typeof input.pattern !== "string") {
      throw new Error(`${label}.pattern must be a string for typed patterns.`);
    }
    assertBoundedTypedPattern(input.pattern, `${label}.pattern`);
    source = input.pattern;
  } else {
    if (typeof input.value !== "string") {
      throw new Error(`${label}.value must be a string for ${type} patterns.`);
    }
    if (input.value.length === 0) {
      throw new Error(`${label}.value must be non-empty.`);
    }
    if (input.value.length > REDACTION_POLICY_LIMITS.maxPatternLength) {
      throw new Error(
        `${label}.value exceeds max length ${REDACTION_POLICY_LIMITS.maxPatternLength}.`,
      );
    }
    const escaped = escapeRegExp(input.value);
    source = type === "prefix" ? `^${escaped}` : escaped;
  }

  let regex: RegExp;
  try {
    regex = new RegExp(source);
  } catch (error) {
    throw new Error(
      `${label} failed to compile: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  return {
    id: `policy.${id}`,
    severity,
    matchKind: "custom",
    detect({ value }) {
      if (typeof value !== "string") return [];
      regex.lastIndex = 0;
      return regex.test(value) ? [{ action: "replace", severity, matchKind: "custom" }] : [];
    },
  };
}

/**
 * Compile a local redaction policy object into extraKeys + detectors.
 * Throws deterministic errors for invalid or unbounded input.
 */
export function compileRedactionPolicy(
  raw: unknown,
  policyPath: string,
): CompiledRedactionPolicy {
  if (!isRecord(raw)) {
    throw new Error(`Redaction policy must be a JSON object (${policyPath}).`);
  }

  const diagnostics: PolicyDiagnostic[] = [];
  if (raw.version !== undefined && raw.version !== 1) {
    throw new Error(`Unsupported redaction policy version (supported: 1).`);
  }

  const extraKeysRaw = raw.extraKeys;
  const extraKeys: string[] = [];
  if (extraKeysRaw !== undefined) {
    if (!Array.isArray(extraKeysRaw)) {
      throw new Error(`extraKeys must be an array of strings.`);
    }
    if (extraKeysRaw.length > REDACTION_POLICY_LIMITS.maxExtraKeys) {
      throw new Error(
        `extraKeys exceeds max count ${REDACTION_POLICY_LIMITS.maxExtraKeys}.`,
      );
    }
    for (let i = 0; i < extraKeysRaw.length; i += 1) {
      const key = extraKeysRaw[i];
      if (typeof key !== "string") {
        throw new Error(`extraKeys[${i}] must be a string.`);
      }
      extraKeys.push(validateExtraKey(key, i));
    }
  }

  const patternsRaw = raw.patterns;
  const detectors: RedactionDetector[] = [];
  if (patternsRaw !== undefined) {
    if (!Array.isArray(patternsRaw)) {
      throw new Error(`patterns must be an array.`);
    }
    if (patternsRaw.length > REDACTION_POLICY_LIMITS.maxPatterns) {
      throw new Error(
        `patterns exceeds max count ${REDACTION_POLICY_LIMITS.maxPatterns}.`,
      );
    }
    const seenIds = new Set<string>();
    for (let i = 0; i < patternsRaw.length; i += 1) {
      const detector = compilePatternDetector(
        patternsRaw[i] as RedactionPolicyPatternInput,
        i,
      );
      if (seenIds.has(detector.id)) {
        throw new Error(`Duplicate pattern id "${detector.id}".`);
      }
      seenIds.add(detector.id);
      detectors.push(detector);
    }
  }

  if (extraKeys.length === 0 && detectors.length === 0) {
    diagnostics.push({
      code: "AI_POLICY_EMPTY",
      message: "Redaction policy contained no extraKeys or patterns.",
    });
  }

  return {
    path: policyPath,
    extraKeys,
    detectors,
    diagnostics,
  };
}

/** Load and compile a local JSON redaction policy file. Never fetches remotes. */
export async function loadRedactionPolicy(
  policyPath: string,
): Promise<CompiledRedactionPolicy> {
  rejectRemotePolicyPath(policyPath);
  const resolved = path.resolve(policyPath);
  let text: string;
  try {
    text = await readFile(resolved, "utf-8");
  } catch (error) {
    throw new Error(
      `Failed to read --policy file "${resolved}": ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch (error) {
    throw new Error(
      `Invalid JSON in --policy file "${resolved}": ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  return compileRedactionPolicy(parsed, resolved);
}
