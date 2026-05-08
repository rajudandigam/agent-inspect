import type { InspectKind, InspectNode, InspectRunTree } from "../types/inspect-event.js";

const REDACT_SUBSTRINGS = [
  "authorization",
  "cookie",
  "token",
  "apikey",
  "password",
  "secret",
  "email",
] as const;

function shouldRedactKey(key: string): boolean {
  const k = key.toLowerCase();
  for (const s of REDACT_SUBSTRINGS) {
    if (k.includes(s)) return true;
  }
  return false;
}

export function safeString(value: unknown, maxLength?: number): string {
  if (value === null || value === undefined) return "";
  let s: string;
  if (typeof value === "string") s = value;
  else if (typeof value === "number" || typeof value === "boolean") s = String(value);
  else s = stableJson(value, false);
  if (maxLength !== undefined && maxLength >= 0 && s.length > maxLength) {
    return `${s.slice(0, maxLength)}…`;
  }
  return s;
}

/** Escape markdown table pipes and normalize line breaks for safe inline text. */
export function escapeMarkdown(value: string): string {
  return value
    .replace(/\|/g, "\\|")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n/g, " ");
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sortKeysDeep(input: unknown): unknown {
  if (input === null || typeof input !== "object") return input;
  if (Array.isArray(input)) return input.map(sortKeysDeep);
  const o = input as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(o).sort()) {
    out[k] = sortKeysDeep(o[k]);
  }
  return out;
}

export function stableJson(value: unknown, pretty?: boolean): string {
  const sorted = sortKeysDeep(value);
  return pretty === true ? JSON.stringify(sorted, null, 2) : JSON.stringify(sorted);
}

export function compactAttributes(
  attrs: Record<string, unknown> | undefined,
  options?: { maxLength?: number; redacted?: boolean },
): Record<string, unknown> {
  if (attrs === undefined) return {};
  const maxLen = options?.maxLength ?? 500;
  const redacted = options?.redacted ?? true;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(attrs).sort()) {
    if (redacted && shouldRedactKey(key)) {
      out[key] = "[REDACTED]";
      continue;
    }
    const v = attrs[key];
    out[key] = compactValue(v, maxLen, redacted);
  }
  return out;
}

function compactValue(value: unknown, maxLen: number, redacted: boolean): unknown {
  if (value === null || typeof value !== "object") {
    return typeof value === "string" ? safeString(value, maxLen) : value;
  }
  if (Array.isArray(value)) {
    const arr = value.slice(0, 20).map((x) => compactValue(x, maxLen, redacted));
    if (value.length > 20) arr.push(`…(+${value.length - 20} more)`);
    return arr;
  }
  const o = value as Record<string, unknown>;
  const inner: Record<string, unknown> = {};
  for (const k of Object.keys(o)) {
    if (redacted && shouldRedactKey(k)) inner[k] = "[REDACTED]";
    else inner[k] = compactValue(o[k], maxLen, redacted);
  }
  return inner;
}

export function summarizeTree(tree: InspectRunTree): Record<string, unknown> {
  const flat = flattenTree(tree);
  const errorNodes = flat.filter((n) => n.event.status === "error").length;
  return {
    runId: tree.runId,
    name: tree.name,
    status: tree.status,
    startedAt: tree.startedAt,
    endedAt: tree.endedAt,
    durationMs: tree.durationMs,
    stepCount: flat.length,
    errorStepCount: errorNodes,
    totalEvents: tree.metadata.totalEvents,
    confidenceBreakdown: { ...tree.metadata.confidenceBreakdown },
    kinds: { ...tree.metadata.kinds },
  };
}

/** Depth-first pre-order flatten (matches typical tree display). */
export function flattenTree(tree: InspectRunTree): InspectNode[] {
  const out: InspectNode[] = [];
  function walk(nodes: InspectNode[]): void {
    for (const n of nodes) {
      out.push(n);
      if (n.children.length > 0) walk(n.children);
    }
  }
  walk(tree.children);
  return out;
}

export function zeroKinds(): Record<InspectKind, number> {
  return {
    RUN: 0,
    AGENT: 0,
    LLM: 0,
    TOOL: 0,
    CHAIN: 0,
    RETRIEVER: 0,
    DECISION: 0,
    RESULT: 0,
    ERROR: 0,
    LOGIC: 0,
    LOG: 0,
  };
}
