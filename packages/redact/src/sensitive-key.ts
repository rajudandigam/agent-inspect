/**
 * Mirrors `packages/core/src/safety/sensitive-key.ts` for dependency-light
 * @agent-inspect/redact consumers. Keep both copies in sync (6.14.2 parity).
 */

/** True when the original key already uses an explicit separator. */
function keyHasExplicitSeparator(value: string): boolean {
  return /[_\-.]/.test(value);
}

/**
 * Canonicalize field names so camelCase / kebab / dot / snake forms share a
 * snake_case shape the compound matcher can recognize (`userPassword` →
 * `user_password`).
 */
export function normalizeSensitiveKey(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export const NON_CREDENTIAL_TOKEN_CONFIG_KEYS: ReadonlySet<string> = new Set(
  [
    "tokens",
    "max_tokens",
    "min_tokens",
    "ls_max_tokens",
    "token_count",
    "token_limit",
    "token_budget",
    "input_tokens",
    "output_tokens",
    "total_tokens",
    "cached_tokens",
    "prompt_tokens",
    "completion_tokens",
  ].map(normalizeSensitiveKey),
);

function isTokenCredentialKey(normalized: string): boolean {
  if (NON_CREDENTIAL_TOKEN_CONFIG_KEYS.has(normalized)) return false;
  if (normalized === "token") return true;
  if (normalized.endsWith("tokens")) return false;
  return normalized.endsWith("token");
}

/**
 * True when the field name looks credential-sensitive under the shared policy.
 *
 * Suffix compounds (`user_password`, `userPassword`) always match. Prefix
 * compounds (`email_note`) match only when the original key already contained
 * an explicit separator, so camelCase topic fields like `emailNote` stay for
 * value detectors instead of key redaction.
 */
export function isCredentialSensitiveKey(
  key: string | undefined,
  sensitiveKeys: readonly string[],
): boolean {
  if (!key) return false;
  const normalized = normalizeSensitiveKey(key);
  if (!normalized) return false;
  if (NON_CREDENTIAL_TOKEN_CONFIG_KEYS.has(normalized)) return false;

  const allowPrefixCompound = keyHasExplicitSeparator(key);

  for (const sensitive of sensitiveKeys) {
    const s = normalizeSensitiveKey(sensitive);
    if (!s) continue;
    if (s === "token") {
      if (isTokenCredentialKey(normalized)) return true;
      continue;
    }
    if (normalized === s) return true;
    if (normalized.endsWith(`_${s}`)) return true;
    if (allowPrefixCompound && normalized.startsWith(`${s}_`)) return true;
  }
  return false;
}
