/**
 * High-confidence free-text credential detectors for pre-disk error messages.
 *
 * Mirrors `@agent-inspect/redact` local-profile value detectors (keep in sync with
 * `packages/redact/src/index.ts` credentialDetectors + `key-value-secret.ts`).
 * Key-based redaction alone cannot protect secrets embedded in `error.message`.
 */

/** Keep in sync with packages/redact/src/key-value-secret.ts. */
const KEY_VALUE_SECRET_PATTERN =
  /\b(?:api[_-]?key|internal[_-]?token|access[_-]?token|auth[_-]?token|password|secret|token)=(?!\[(?:REDACTED[^\]\s]*|HASH:[0-9a-f]{8})\])([^\s"'\\]{8,})/i;

/**
 * Ordered high-confidence value patterns. A match replaces the whole string
 * with `[REDACTED]`, matching `@agent-inspect/redact` detector replace semantics.
 */
const HIGH_CONFIDENCE_CREDENTIAL_PATTERNS: readonly RegExp[] = [
  /^(?:basic|bearer|digest|apikey)\s+[a-z0-9._~+/=-]+$/i,
  /\bbearer\s+[a-z0-9._~+/=-]{12,}\b/i,
  /\b[a-z0-9_.-]+=[^;\s]+(?:;\s*[a-z0-9_.-]+=[^;\s]+)+/i,
  /\beyJ[a-zA-Z0-9_-]{8,}\.[a-zA-Z0-9_-]{8,}\.[a-zA-Z0-9_-]{8,}\b/,
  /\b(?:sk-(?:proj-)?[a-zA-Z0-9_-]{16,}|sk-ant-[a-zA-Z0-9_-]{16,}|AIza[0-9A-Za-z_-]{20,})\b/,
  /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{20,}\b/,
  /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*-----END [A-Z ]*PRIVATE KEY-----/,
  KEY_VALUE_SECRET_PATTERN,
];

export function stringContainsHighConfidenceCredential(value: string): boolean {
  for (const pattern of HIGH_CONFIDENCE_CREDENTIAL_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(value)) {
      pattern.lastIndex = 0;
      return true;
    }
  }
  return false;
}

/**
 * When a free-text string matches a high-confidence credential detector,
 * replace the whole value (Redactor-compatible). Otherwise return unchanged.
 */
export function redactHighConfidenceCredentialsInString(
  value: string,
  replacement = "[REDACTED]",
): string {
  return stringContainsHighConfidenceCredential(value) ? replacement : value;
}
