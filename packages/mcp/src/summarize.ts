const DEFAULT_MAX_SUMMARY_LENGTH = 240;

function fallbackString(value: unknown): string {
  try {
    return String(value);
  } catch {
    return "[unserializable]";
  }
}

export function summarizeMcpValue(
  value: unknown,
  maxLength = DEFAULT_MAX_SUMMARY_LENGTH,
): string {
  let text: string;
  try {
    if (typeof value === "string") {
      text = value;
    } else {
      // JSON.stringify returns undefined (not a string) for undefined,
      // functions, and symbols; falling through with undefined would crash
      // instrumentation at text.length below.
      const serialized = JSON.stringify(value);
      text = serialized === undefined ? fallbackString(value) : serialized;
    }
  } catch {
    text = fallbackString(value);
  }
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 3))}...`;
}

export function hashServerUrl(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i += 1) {
    hash = (hash * 31 + url.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}
