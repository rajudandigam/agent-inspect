import { readFile, stat } from "node:fs/promises";

import type { RedactionDetector, RedactionSeverity } from "@agent-inspect/redact";

/**
 * Bounded local redaction policy (experimental, 6.18+).
 *
 * A policy file only *adds* sensitive keys and bounded value patterns on top of the
 * built-in profiles. It can never disable built-in high-confidence protection, execute
 * code, fetch a remote document, interpolate environment variables, or supply raw regex.
 */

/** Maximum accepted policy file size on disk. */
export const MAX_POLICY_FILE_BYTES = 64 * 1024;
/** Maximum combined `sensitiveKeys` + `valuePatterns` entries. */
export const MAX_POLICY_RULES = 200;
/** Maximum accepted `sensitiveKeys` entry length. */
export const MAX_POLICY_KEY_LENGTH = 128;
/** Minimum accepted `prefix` length (shorter prefixes match too much). */
export const MIN_POLICY_PREFIX_LENGTH = 3;
/** Maximum accepted `prefix` length. */
export const MAX_POLICY_PREFIX_LENGTH = 64;
/** Maximum accepted rule `id` length. */
export const MAX_POLICY_ID_LENGTH = 64;
/** Default number of trailing secret characters a bounded pattern requires. */
export const DEFAULT_MIN_SECRET_LENGTH = 8;
/** Maximum accepted `minSecretLength`. */
export const MAX_MIN_SECRET_LENGTH = 256;

/** Longest string prefix scanned by a policy detector (bounds worst-case work). */
const MAX_SCAN_LENGTH = 64 * 1024;
/** Maximum candidate positions examined per string per rule. */
const MAX_SCAN_OCCURRENCES = 64;

const POLICY_VERSION = 1;
const TOP_LEVEL_KEYS = new Set(["policyVersion", "sensitiveKeys", "valuePatterns"]);
const PREFIX_RULE_KEYS = new Set(["id", "type", "prefix", "minSecretLength", "severity"]);
const KEY_VALUE_RULE_KEYS = new Set(["id", "type", "key", "minSecretLength", "severity"]);
const SEVERITIES = new Set<RedactionSeverity>(["warning", "error"]);

/** Compiled, validated policy safe to hand to `@agent-inspect/redact`. */
export interface CompiledRedactionPolicy {
  readonly policyVersion: number;
  readonly source: string;
  readonly sensitiveKeys: readonly string[];
  readonly detectors: readonly RedactionDetector[];
  readonly ruleCount: number;
}

function policyError(message: string): Error {
  return new Error(`--policy ${message}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function rejectUnknownKeys(
  record: Record<string, unknown>,
  allowed: ReadonlySet<string>,
  where: string,
): void {
  const unknown = Object.keys(record)
    .filter((key) => !allowed.has(key))
    .sort((a, b) => a.localeCompare(b));
  if (unknown.length > 0) {
    throw policyError(`${where} has unsupported field(s): ${unknown.join(", ")}.`);
  }
}

function isIdentifierChar(code: number): boolean {
  return (
    (code >= 48 && code <= 57) ||
    (code >= 65 && code <= 90) ||
    (code >= 97 && code <= 122) ||
    code === 46 ||
    code === 45 ||
    code === 95
  );
}

/** Word-boundary alphabet used to reject matches glued inside a longer token. */
function isTokenChar(code: number): boolean {
  return (
    (code >= 48 && code <= 57) ||
    (code >= 65 && code <= 90) ||
    (code >= 97 && code <= 122) ||
    code === 45 ||
    code === 95
  );
}

/** Character class accepted inside a bounded secret value. */
function isSecretChar(code: number): boolean {
  return (
    isTokenChar(code) ||
    code === 46 ||
    code === 43 ||
    code === 47 ||
    code === 61 ||
    code === 126
  );
}

function assertIdentifier(value: unknown, where: string, maxLength: number): string {
  if (typeof value !== "string" || value.length === 0) {
    throw policyError(`${where} must be a non-empty string.`);
  }
  if (value.length > maxLength) {
    throw policyError(`${where} must be at most ${maxLength} characters.`);
  }
  for (let index = 0; index < value.length; index += 1) {
    if (!isIdentifierChar(value.charCodeAt(index))) {
      throw policyError(`${where} may only contain letters, digits, '.', '-', and '_'.`);
    }
  }
  return value;
}

function assertSeverity(value: unknown, where: string): RedactionSeverity {
  if (value === undefined) return "warning";
  if (typeof value !== "string" || !SEVERITIES.has(value as RedactionSeverity)) {
    throw policyError(`${where} must be "warning" or "error".`);
  }
  return value as RedactionSeverity;
}

function assertMinSecretLength(value: unknown, where: string): number {
  if (value === undefined) return DEFAULT_MIN_SECRET_LENGTH;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw policyError(`${where} must be a positive integer.`);
  }
  if (value > MAX_MIN_SECRET_LENGTH) {
    throw policyError(`${where} must be at most ${MAX_MIN_SECRET_LENGTH}.`);
  }
  return value;
}

function trailingSecretLength(value: string, from: number): number {
  let index = from;
  while (index < value.length && isSecretChar(value.charCodeAt(index))) index += 1;
  return index - from;
}

/** ASCII case-insensitive `indexOf`; policy keys and prefixes are ASCII-only by validation. */
function indexOfAscii(haystack: string, needleLower: string, from: number): number {
  const limit = haystack.length - needleLower.length;
  for (let start = from; start <= limit; start += 1) {
    let matched = true;
    for (let offset = 0; offset < needleLower.length; offset += 1) {
      let code = haystack.charCodeAt(start + offset);
      if (code >= 65 && code <= 90) code += 32;
      if (code !== needleLower.charCodeAt(offset)) {
        matched = false;
        break;
      }
    }
    if (matched) return start;
  }
  return -1;
}

function scanCandidates(
  value: string,
  needleLower: string,
  onMatch: (index: number) => boolean,
): boolean {
  const scanned = value.length > MAX_SCAN_LENGTH ? value.slice(0, MAX_SCAN_LENGTH) : value;
  let from = 0;
  for (let seen = 0; seen < MAX_SCAN_OCCURRENCES; seen += 1) {
    const index = indexOfAscii(scanned, needleLower, from);
    if (index < 0) return false;
    const before = index === 0 ? undefined : scanned.charCodeAt(index - 1);
    if (before === undefined || !isTokenChar(before)) {
      if (onMatch(index)) return true;
    }
    from = index + 1;
  }
  return false;
}

function prefixDetector(
  id: string,
  prefix: string,
  minSecretLength: number,
  severity: RedactionSeverity,
): RedactionDetector {
  const needle = prefix.toLowerCase();
  return {
    id: `policy.${id}`,
    severity,
    matchKind: "value",
    detect(input) {
      if (typeof input.value !== "string") return [];
      const matched = scanCandidates(input.value, needle, (index) => {
        const scanned = input.value as string;
        return trailingSecretLength(scanned, index + prefix.length) >= minSecretLength;
      });
      return matched ? [{ action: "replace", severity, matchKind: "value" }] : [];
    },
  };
}

function keyValueDetector(
  id: string,
  key: string,
  minSecretLength: number,
  severity: RedactionSeverity,
): RedactionDetector {
  const needle = key.toLowerCase();
  return {
    id: `policy.${id}`,
    severity,
    matchKind: "value",
    detect(input) {
      if (typeof input.value !== "string") return [];
      const text = input.value;
      const matched = scanCandidates(text, needle, (index) => {
        let cursor = index + key.length;
        while (cursor < text.length && (text[cursor] === " " || text[cursor] === "\t")) cursor += 1;
        const separator = text[cursor];
        if (separator !== "=" && separator !== ":") return false;
        cursor += 1;
        while (cursor < text.length && (text[cursor] === " " || text[cursor] === "\t")) cursor += 1;
        if (text[cursor] === '"' || text[cursor] === "'") cursor += 1;
        return trailingSecretLength(text, cursor) >= minSecretLength;
      });
      return matched ? [{ action: "replace", severity, matchKind: "value" }] : [];
    },
  };
}

function compileValuePattern(entry: unknown, position: number, ids: Set<string>): RedactionDetector {
  const where = `valuePatterns[${position}]`;
  if (!isRecord(entry)) throw policyError(`${where} must be an object.`);

  const type = entry.type;
  if (type !== "prefix" && type !== "key-value") {
    throw policyError(`${where}.type must be "prefix" or "key-value".`);
  }
  rejectUnknownKeys(entry, type === "prefix" ? PREFIX_RULE_KEYS : KEY_VALUE_RULE_KEYS, where);

  const id = assertIdentifier(entry.id, `${where}.id`, MAX_POLICY_ID_LENGTH);
  if (ids.has(id)) throw policyError(`${where}.id "${id}" is duplicated.`);
  ids.add(id);

  const minSecretLength = assertMinSecretLength(entry.minSecretLength, `${where}.minSecretLength`);
  const severity = assertSeverity(entry.severity, `${where}.severity`);

  if (type === "prefix") {
    const prefix = entry.prefix;
    if (typeof prefix !== "string") throw policyError(`${where}.prefix must be a string.`);
    if (prefix.length < MIN_POLICY_PREFIX_LENGTH) {
      throw policyError(`${where}.prefix must be at least ${MIN_POLICY_PREFIX_LENGTH} characters.`);
    }
    if (prefix.length > MAX_POLICY_PREFIX_LENGTH) {
      throw policyError(`${where}.prefix must be at most ${MAX_POLICY_PREFIX_LENGTH} characters.`);
    }
    for (let index = 0; index < prefix.length; index += 1) {
      const code = prefix.charCodeAt(index);
      if (code < 33 || code > 126) {
        throw policyError(`${where}.prefix must contain printable ASCII without whitespace.`);
      }
    }
    return prefixDetector(id, prefix, minSecretLength, severity);
  }

  const key = assertIdentifier(entry.key, `${where}.key`, MAX_POLICY_KEY_LENGTH);
  return keyValueDetector(id, key, minSecretLength, severity);
}

/** Validates and compiles an already-parsed policy document. */
export function compileRedactionPolicy(
  document: unknown,
  source: string,
): CompiledRedactionPolicy {
  if (!isRecord(document)) throw policyError(`${source} must contain a JSON object.`);
  rejectUnknownKeys(document, TOP_LEVEL_KEYS, source);

  if (document.policyVersion !== POLICY_VERSION) {
    throw policyError(`${source} must set "policyVersion": ${POLICY_VERSION}.`);
  }

  const rawKeys = document.sensitiveKeys ?? [];
  if (!Array.isArray(rawKeys)) throw policyError(`${source} sensitiveKeys must be an array.`);
  const rawPatterns = document.valuePatterns ?? [];
  if (!Array.isArray(rawPatterns)) throw policyError(`${source} valuePatterns must be an array.`);

  const ruleCount = rawKeys.length + rawPatterns.length;
  if (ruleCount > MAX_POLICY_RULES) {
    throw policyError(
      `${source} declares ${ruleCount} rules; the maximum is ${MAX_POLICY_RULES}.`,
    );
  }

  const sensitiveKeys: string[] = [];
  const seenKeys = new Set<string>();
  rawKeys.forEach((entry, index) => {
    const key = assertIdentifier(entry, `sensitiveKeys[${index}]`, MAX_POLICY_KEY_LENGTH);
    const normalized = key.toLowerCase();
    if (seenKeys.has(normalized)) return;
    seenKeys.add(normalized);
    sensitiveKeys.push(key);
  });

  const ids = new Set<string>();
  const detectors = rawPatterns.map((entry, index) => compileValuePattern(entry, index, ids));

  return {
    policyVersion: POLICY_VERSION,
    source,
    sensitiveKeys,
    detectors,
    ruleCount,
  };
}

/** Reads, bounds-checks, and compiles a local policy file. Never fetches remote documents. */
export async function loadRedactionPolicy(
  policyPath: string,
): Promise<CompiledRedactionPolicy> {
  const trimmed = policyPath.trim();
  if (trimmed === "") throw policyError("requires a local file path.");
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) {
    throw policyError("only accepts a local file path; remote policy URLs are not supported.");
  }

  let stats;
  try {
    stats = await stat(trimmed);
  } catch {
    throw policyError(`file not found: ${trimmed}`);
  }
  if (stats.isDirectory()) throw policyError(`must be a JSON file, not a directory: ${trimmed}`);
  if (stats.size > MAX_POLICY_FILE_BYTES) {
    throw policyError(
      `file ${trimmed} is ${stats.size} bytes; the maximum is ${MAX_POLICY_FILE_BYTES} bytes.`,
    );
  }

  const raw = await readFile(trimmed, "utf-8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw policyError(`file ${trimmed} is not valid JSON.`);
  }
  return compileRedactionPolicy(parsed, trimmed);
}

/** Deterministic, value-free policy summary for JSON output. */
export function summarizeRedactionPolicy(
  policy: CompiledRedactionPolicy,
): { source: string; policyVersion: number; sensitiveKeys: number; valuePatterns: number } {
  return {
    source: policy.source,
    policyVersion: policy.policyVersion,
    sensitiveKeys: policy.sensitiveKeys.length,
    valuePatterns: policy.detectors.length,
  };
}
