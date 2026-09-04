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
 * maxTokens=, tokenCount=, secret=false, or short placeholders.
 */
export const KEY_VALUE_SECRET_PATTERN_SOURCE =
  String.raw`\b(?:api[_-]?key|internal[_-]?token|access[_-]?token|auth[_-]?token|password|secret|token)=([^\s"'\\]{8,})`;

export const KEY_VALUE_SECRET_PATTERN = new RegExp(
  KEY_VALUE_SECRET_PATTERN_SOURCE,
  "i",
);

export function valueContainsKeyValueSecret(value: string): boolean {
  KEY_VALUE_SECRET_PATTERN.lastIndex = 0;
  return KEY_VALUE_SECRET_PATTERN.test(value);
}
