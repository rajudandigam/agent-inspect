const DEFAULT_MAX_SUMMARY_LENGTH = 240;

export function summarizeMcpValue(
  value: unknown,
  maxLength = DEFAULT_MAX_SUMMARY_LENGTH,
): string {
  let text: string;
  try {
    if (typeof value === "string") {
      text = value;
    } else {
      text = JSON.stringify(value);
    }
  } catch {
    text = String(value);
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
