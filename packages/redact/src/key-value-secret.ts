/**
 * High-confidence key/value credential forms shared with core
 * `safety.secretPattern` / `key-value-secret` (keep sources in sync).
 *
 * Matches house-format credentials such as:
 *   internal_token=<credential>
 *   token=<credential>
 *   api_key=<credential>
 *
 * Intentionally does **not** match metric/config lookalikes such as
 * maxTokens=, tokenCount=, secret=false, short placeholders, or values that are
 * *entirely* a redaction placeholder (`[REDACTED]`, `[REDACTED:…]`, `[HASH:xxxxxxxx]`).
 * A marker used as a prefix (`[REDACTED]canary…`) or incomplete marker
 * (`[REDACTED]/canary…`) is still a secret. Query separators (`&`, `#`, `?`)
 * may end a complete placeholder when the same form appears in a URL query;
 * `/` and `;` do **not** — they are ordinary free-text characters.
 */
export const KEY_VALUE_SECRET_PATTERN_SOURCE =
  String.raw`\b(?:api[_-]?key|internal[_-]?token|access[_-]?token|auth[_-]?token|password|secret|token)=(?!\[(?:REDACTED(?::[^\]]*)?|HASH:[0-9a-f]{8})\](?![^\s"'\\&#?]))([^\s"'\\]{8,})`;

export const KEY_VALUE_SECRET_PATTERN = new RegExp(
  KEY_VALUE_SECRET_PATTERN_SOURCE,
  "i",
);

export function valueContainsKeyValueSecret(value: string): boolean {
  KEY_VALUE_SECRET_PATTERN.lastIndex = 0;
  return KEY_VALUE_SECRET_PATTERN.test(value);
}
