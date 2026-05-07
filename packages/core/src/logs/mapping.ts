import type { LogEventMapping } from "../types/log-config.js";

export function wildcardMatch(pattern: string, value: string): boolean {
  if (pattern === value) return true;
  if (!pattern.includes("*")) return false;

  const parts = pattern.split("*");
  let idx = 0;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]!;
    if (part === "") continue;
    const found = value.indexOf(part, idx);
    if (found === -1) return false;
    if (i === 0 && !pattern.startsWith("*") && found !== 0) return false;
    idx = found + part.length;
  }
  if (!pattern.endsWith("*")) {
    const last = parts[parts.length - 1]!;
    if (last !== "" && !value.endsWith(last)) return false;
    if (last === "" && !value.endsWith(parts[parts.length - 2] ?? "")) return false;
  }
  return true;
}

export function matchMapping(
  eventName: string,
  mappings?: Record<string, LogEventMapping>,
): LogEventMapping | undefined {
  if (!mappings) return undefined;
  if (mappings[eventName]) return mappings[eventName];

  let bestKey: string | undefined;
  let bestScore = -1;

  for (const key of Object.keys(mappings)) {
    if (!key.includes("*")) continue;
    if (!wildcardMatch(key, eventName)) continue;
    const score = key.replaceAll("*", "").length;
    if (score > bestScore) {
      bestScore = score;
      bestKey = key;
    }
  }

  return bestKey ? mappings[bestKey] : undefined;
}

