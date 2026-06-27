import crypto from "node:crypto";

export type RedactionProfile = "local" | "share" | "strict";

export type RedactionAction = "replace" | "hash" | "prefix" | "truncate" | "keep";

export type RedactionSeverity = "info" | "warning" | "error";

export type RedactionMatchKind = "key" | "value" | "custom";

export type RedactionRule =
  | string
  | { key: string; strategy: "full" }
  | { key: string; strategy: "prefix"; keep?: number }
  | { key: string; strategy: "hash" };

export interface RedactionFinding {
  path: string;
  detector: string;
  action: RedactionAction;
  severity: RedactionSeverity;
  matchKind: RedactionMatchKind;
  preview?: string;
}

export interface RedactionDetection {
  action?: RedactionAction;
  replacement?: unknown;
  severity?: RedactionSeverity;
  matchKind?: RedactionMatchKind;
  preview?: string;
}

export interface RedactionDetectorInput {
  path: string;
  key?: string;
  value: unknown;
}

export interface RedactionDetector {
  id: string;
  severity?: RedactionSeverity;
  matchKind?: RedactionMatchKind;
  detect(input: RedactionDetectorInput): RedactionDetection[];
}

export interface RedactionResult<T = unknown> {
  value: T;
  findings: RedactionFinding[];
  redacted: boolean;
  profile: RedactionProfile;
}

export interface ResolvedRedactionProfile {
  profile: RedactionProfile;
  extraKeys: readonly string[];
  maxMetadataValueLengthCap?: number;
  maxPreviewLengthCap?: number;
}

export interface RedactOptions {
  profile?: RedactionProfile;
  detectors?: RedactionDetector[];
  rules?: RedactionRule[];
  replacement?: string;
  maxDepth?: number;
  maxStringLength?: number;
  collectFindings?: boolean;
}

export interface RedactorOptions extends RedactOptions {
  extraKeys?: readonly string[];
}

export const DEFAULT_REDACT_KEYS = [
  "authorization",
  "cookie",
  "token",
  "apiKey",
  "password",
  "secret",
  "email",
] as const;

export const SHARE_PROFILE_EXTRA_KEYS = [
  "userEmail",
  "customerEmail",
  "phone",
  "phoneNumber",
  "address",
  "ip",
  "ipAddress",
  "sessionId",
  "requestId",
  "correlationId",
  "decisionId",
  "groupId",
  "customerId",
  "userId",
  "accountId",
  "tenantId",
  "orgId",
  "organizationId",
  "traceId",
  "spanId",
  "parentSpanId",
] as const;

export const STRICT_PROFILE_EXTRA_KEYS = [
  "prompt",
  "completion",
  "input",
  "output",
  "inputPreview",
  "outputPreview",
  "message",
  "messages",
  "transcript",
  "context",
  "document",
  "documents",
  "chunk",
  "chunks",
  "retrieval",
  "query",
] as const;

type CompiledRule =
  | { key: string; strategy: "full" }
  | { key: string; strategy: "prefix"; keep: number }
  | { key: string; strategy: "hash" };

interface RedactionState {
  findings: RedactionFinding[];
  seen: WeakMap<object, unknown>;
}

interface PatternDetectorOptions {
  id: string;
  pattern: RegExp;
  severity?: RedactionSeverity;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toKey(key: string): string {
  return key.toLowerCase();
}

function stableHash(value: string): string {
  const hash = crypto.createHash("sha256").update(value, "utf8").digest("hex");
  return hash.slice(0, 8);
}

function stringifyScalar(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return String(value);
  }
  return undefined;
}

function patternDetector(options: PatternDetectorOptions): RedactionDetector {
  return {
    id: options.id,
    severity: options.severity ?? "warning",
    matchKind: "value",
    detect(input) {
      if (typeof input.value !== "string") return [];
      options.pattern.lastIndex = 0;
      return options.pattern.test(input.value)
        ? [{ action: "replace", severity: options.severity ?? "warning", matchKind: "value" }]
        : [];
    },
  };
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function passesLuhn(value: string): boolean {
  const digits = digitsOnly(value);
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}

const credentialDetectors: readonly RedactionDetector[] = [
  patternDetector({
    id: "value.authorizationHeader",
    pattern: /^(?:basic|bearer|digest|apikey)\s+[a-z0-9._~+/=-]+$/i,
    severity: "error",
  }),
  patternDetector({
    id: "value.bearerToken",
    pattern: /\bbearer\s+[a-z0-9._~+/=-]{12,}\b/i,
    severity: "error",
  }),
  patternDetector({
    id: "value.cookie",
    pattern: /\b[a-z0-9_.-]+=[^;\s]+(?:;\s*[a-z0-9_.-]+=[^;\s]+)+/i,
    severity: "error",
  }),
  patternDetector({
    id: "value.jwt",
    pattern: /\beyJ[a-zA-Z0-9_-]{8,}\.[a-zA-Z0-9_-]{8,}\.[a-zA-Z0-9_-]{8,}\b/,
    severity: "error",
  }),
  patternDetector({
    id: "value.providerApiKey",
    pattern: /\b(?:sk-(?:proj-)?[a-zA-Z0-9_-]{16,}|sk-ant-[a-zA-Z0-9_-]{16,}|AIza[0-9A-Za-z_-]{20,})\b/,
    severity: "error",
  }),
  patternDetector({
    id: "value.githubToken",
    pattern: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{20,}\b/,
    severity: "error",
  }),
  patternDetector({
    id: "value.awsAccessKey",
    pattern: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/,
    severity: "error",
  }),
  patternDetector({
    id: "value.privateKey",
    pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*-----END [A-Z ]*PRIVATE KEY-----/,
    severity: "error",
  }),
  {
    id: "value.creditCard",
    severity: "error",
    matchKind: "value",
    detect(input) {
      if (typeof input.value !== "string") return [];
      const candidatePattern = /(?:\d[ -]?){13,19}/g;
      for (const match of input.value.matchAll(candidatePattern)) {
        const candidate = match[0] ?? "";
        if (passesLuhn(candidate)) {
          return [{ action: "replace", severity: "error", matchKind: "value" }];
        }
      }
      return [];
    },
  },
];

const identifierDetectors: readonly RedactionDetector[] = [
  patternDetector({
    id: "value.email",
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  }),
  patternDetector({
    id: "value.phone",
    pattern: /\b(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-])\d{3}[\s.-]\d{4}\b/,
  }),
  patternDetector({
    id: "value.ipv4",
    pattern: /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/,
  }),
  patternDetector({
    id: "value.ipv6",
    pattern: /\b(?:[0-9a-f]{1,4}:){2,7}[0-9a-f]{1,4}\b/i,
  }),
];

function builtInDetectorsForProfile(profile: RedactionProfile): readonly RedactionDetector[] {
  if (profile === "local") return credentialDetectors;
  return [...credentialDetectors, ...identifierDetectors];
}

function compileRules(
  rules?: RedactionRule[],
  extraKeys?: readonly string[],
): CompiledRule[] {
  const out = new Map<string, CompiledRule>();

  const set = (rule: CompiledRule) => {
    const key = toKey(rule.key);
    out.set(key, { ...rule, key } as CompiledRule);
  };

  for (const key of DEFAULT_REDACT_KEYS) {
    set({ key, strategy: "full" });
  }

  for (const key of extraKeys ?? []) {
    if (typeof key === "string" && key.length > 0) {
      set({ key, strategy: "full" });
    }
  }

  for (const rule of rules ?? []) {
    if (typeof rule === "string") {
      set({ key: rule, strategy: "full" });
      continue;
    }

    if (rule.strategy === "full") set({ key: rule.key, strategy: "full" });
    if (rule.strategy === "hash") set({ key: rule.key, strategy: "hash" });
    if (rule.strategy === "prefix") {
      set({
        key: rule.key,
        strategy: "prefix",
        keep: typeof rule.keep === "number" ? rule.keep : 8,
      });
    }
  }

  return [...out.values()];
}

function actionForRule(rule: CompiledRule): RedactionAction {
  if (rule.strategy === "full") return "replace";
  return rule.strategy;
}

function applyRule(
  rule: CompiledRule,
  value: unknown,
  replacement: string,
): unknown {
  if (rule.strategy === "full") return replacement;

  const asString = stringifyScalar(value);
  if (rule.strategy === "prefix") {
    if (asString === undefined) return replacement;
    const keep = Math.max(0, Math.floor(rule.keep));
    return asString.length <= keep ? `${asString}…` : `${asString.slice(0, keep)}…`;
  }

  if (rule.strategy === "hash") {
    if (asString === undefined) return "[HASH:unknown]";
    return `[HASH:${stableHash(asString)}]`;
  }

  return value;
}

function childPath(path: string, key: string): string {
  if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key)) {
    return path ? `${path}.${key}` : key;
  }
  return `${path || "$"}[${JSON.stringify(key)}]`;
}

function indexPath(path: string, index: number): string {
  return `${path || "$"}[${index}]`;
}

function makeFinding(
  path: string,
  detector: string,
  action: RedactionAction,
  matchKind: RedactionMatchKind,
  severity: RedactionSeverity = "warning",
  preview?: string,
): RedactionFinding {
  return preview === undefined
    ? { path, detector, action, severity, matchKind }
    : { path, detector, action, severity, matchKind, preview };
}

export function createRedactionProfile(profile: RedactionProfile = "local"): ResolvedRedactionProfile {
  switch (profile) {
    case "local":
      return { profile: "local", extraKeys: [] };
    case "share":
      return {
        profile: "share",
        extraKeys: SHARE_PROFILE_EXTRA_KEYS,
        maxMetadataValueLengthCap: 500,
        maxPreviewLengthCap: 200,
      };
    case "strict":
      return {
        profile: "strict",
        extraKeys: [...SHARE_PROFILE_EXTRA_KEYS, ...STRICT_PROFILE_EXTRA_KEYS],
        maxMetadataValueLengthCap: 200,
        maxPreviewLengthCap: 80,
      };
  }
}

export class Redactor {
  readonly #rules: CompiledRule[];
  readonly #detectors: readonly RedactionDetector[];
  readonly #profile: RedactionProfile;
  readonly #replacement: string;
  readonly #maxDepth: number;
  readonly #collectFindings: boolean;

  constructor(options?: RedactorOptions) {
    const resolved = createRedactionProfile(options?.profile ?? "local");
    this.#profile = resolved.profile;
    this.#rules = compileRules(options?.rules, [
      ...resolved.extraKeys,
      ...(options?.extraKeys ?? []),
    ]);
    this.#detectors = [
      ...builtInDetectorsForProfile(this.#profile),
      ...(options?.detectors ?? []),
    ];
    this.#replacement = options?.replacement ?? "[REDACTED]";
    this.#maxDepth = options?.maxDepth ?? 32;
    this.#collectFindings = options?.collectFindings ?? true;
  }

  redactValue(key: string, value: unknown): unknown {
    return this.#redactValue(value, key, key, 0, {
      findings: [],
      seen: new WeakMap<object, unknown>(),
    });
  }

  redactRecord(record: Record<string, unknown>): Record<string, unknown> {
    return this.redact(record).value as Record<string, unknown>;
  }

  redact<T = unknown>(value: T): RedactionResult<T> {
    const state: RedactionState = {
      findings: [],
      seen: new WeakMap<object, unknown>(),
    };
    const redacted = this.#redactValue(value, undefined, "$", 0, state);
    return {
      value: redacted as T,
      findings: state.findings,
      redacted: state.findings.some((finding) => finding.action !== "keep"),
      profile: this.#profile,
    };
  }

  #recordFinding(state: RedactionState, finding: RedactionFinding): void {
    if (this.#collectFindings) state.findings.push(finding);
  }

  #redactValue(
    value: unknown,
    key: string | undefined,
    path: string,
    depth: number,
    state: RedactionState,
  ): unknown {
    if (depth > this.#maxDepth) {
      this.#recordFinding(
        state,
        makeFinding(path, "structure.maxDepth", "truncate", "value", "warning"),
      );
      return "[Truncated]";
    }

    if (key !== undefined) {
      const rule = this.#rules.find((candidate) => candidate.key === toKey(key));
      if (rule) {
        this.#recordFinding(
          state,
          makeFinding(path, `key.${rule.key}`, actionForRule(rule), "key", "warning"),
        );
        return applyRule(rule, value, this.#replacement);
      }
    }

    for (const detector of this.#detectors) {
      const detections = detector.detect({ path, key, value });
      for (const detection of detections) {
        const action = detection.action ?? "replace";
        this.#recordFinding(
          state,
          makeFinding(
            path,
            detector.id,
            action,
            detection.matchKind ?? detector.matchKind ?? "custom",
            detection.severity ?? detector.severity ?? "warning",
            detection.preview,
          ),
        );
        if (action !== "keep") {
          return detection.replacement ?? this.#replacement;
        }
      }
    }

    if (Array.isArray(value)) {
      if (state.seen.has(value)) return state.seen.get(value);
      const out: unknown[] = [];
      state.seen.set(value, out);
      value.forEach((item, index) => {
        out[index] = this.#redactValue(item, undefined, indexPath(path, index), depth + 1, state);
      });
      return out;
    }

    if (isRecord(value)) {
      if (state.seen.has(value)) return state.seen.get(value);
      const out: Record<string, unknown> = {};
      state.seen.set(value, out);
      for (const [entryKey, entryValue] of Object.entries(value)) {
        out[entryKey] = this.#redactValue(
          entryValue,
          entryKey,
          childPath(path === "$" ? "" : path, entryKey),
          depth + 1,
          state,
        );
      }
      return out;
    }

    return value;
  }
}

export function createRedactor(options?: RedactorOptions): Redactor {
  return new Redactor(options);
}

export function redact<T = unknown>(value: T, options?: RedactOptions): RedactionResult<T> {
  return createRedactor(options).redact(value);
}
