import type { InspectNode, InspectRunTree } from "../types/inspect-event.js";

export interface RenderTreeOptions {
  verbose?: boolean;
  showConfidence?: "always" | "non-explicit" | "never";
  showMetadata?: boolean;
  color?: boolean;
  maxAttributeLength?: number;
  summary?: boolean;
}

function truncate(v: string, max: number): string {
  if (v.length <= max) return v;
  return v.slice(0, Math.max(0, max - 1)) + "…";
}

function fmtAttrValue(value: unknown, maxLen: number): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string") return truncate(value, maxLen);
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return String(value);
  }
  if (typeof value === "object") {
    try {
      return truncate(JSON.stringify(value), maxLen);
    } catch {
      return "[object]";
    }
  }
  return String(value);
}

function compactAttrs(attrs: Record<string, unknown> | undefined, maxLen: number): string {
  if (!attrs) return "";
  const entries = Object.entries(attrs);
  if (entries.length === 0) return "";

  const picks = new Map<string, string>();
  const set = (k: string, v: unknown) => {
    const s = fmtAttrValue(v, maxLen);
    if (s !== undefined) picks.set(k, s);
  };

  // Prefer common keys in expected output
  set("job", attrs.jobId ?? attrs.job ?? attrs.jobUuid);
  set("user", attrs.userUuid ?? attrs.userId ?? attrs.user);
  set("trip", attrs.tripUuid ?? attrs.tripId ?? attrs.trip);
  set("msgs", attrs.messageCount ?? attrs.msgs);
  set("trips", attrs.trips);
  set("model", attrs.model);

  // tokens: input/output
  const tokens = attrs.tokens;
  if (tokens && typeof tokens === "object" && tokens !== null) {
    const input = (tokens as any).input;
    const output = (tokens as any).output;
    if (typeof input === "number" || typeof output === "number") {
      picks.set("tokens", `${input ?? "?"}/${output ?? "?"}`);
    }
  }

  // Allow a few booleans/strings
  for (const k of ["shouldNotify", "variant"] as const) {
    if (k in attrs) set(k, (attrs as any)[k]);
  }

  const rendered = [...picks.entries()]
    .filter(([, v]) => v !== "")
    .map(([k, v]) => `${k}=${v}`);

  return rendered.length > 0 ? " " + rendered.join(" ") : "";
}

function statusMark(node: InspectNode): string {
  if (node.event.status === "error") return " ✖";
  if (node.event.status === "ok") return " ✔";
  return "";
}

function fmtDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function renderNodeLines(node: InspectNode, prefix: string, isLast: boolean, options: Required<RenderTreeOptions>): string[] {
  const branch = prefix + (isLast ? "└─ " : "├─ ");
  const nextPrefix = prefix + (isLast ? "   " : "│  ");
  const attrs = compactAttrs(node.event.attributes, options.maxAttributeLength);
  const dur = node.event.durationMs !== undefined ? ` ${fmtDuration(node.event.durationMs)}` : "";
  const line = `${branch}${node.event.name}${attrs}${statusMark(node)}${dur}`;

  const lines = [line];

  const showConf =
    options.showConfidence === "always" ||
    (options.showConfidence === "non-explicit" && node.event.confidence !== "explicit");
  if (showConf) {
    lines.push(`${nextPrefix}confidence: ${node.event.confidence}`);
  }

  const children = node.children;
  for (let i = 0; i < children.length; i++) {
    lines.push(...renderNodeLines(children[i]!, nextPrefix, i === children.length - 1, options));
  }
  return lines;
}

export function renderRunTree(tree: InspectRunTree, options?: RenderTreeOptions): string {
  const opts: Required<RenderTreeOptions> = {
    verbose: options?.verbose ?? false,
    showConfidence: options?.showConfidence ?? "always",
    showMetadata: options?.showMetadata ?? false,
    color: options?.color ?? false,
    maxAttributeLength: options?.maxAttributeLength ?? 40,
    summary: options?.summary ?? true,
  };

  const header = `Run ${tree.runId}`;
  const lines: string[] = [header];

  const children = tree.children;
  for (let i = 0; i < children.length; i++) {
    lines.push(...renderNodeLines(children[i]!, "", i === children.length - 1, opts));
  }

  if (opts.summary) {
    const cb = tree.metadata.confidenceBreakdown;
    const tools = tree.metadata.kinds.TOOL ?? 0;
    const llms = tree.metadata.kinds.LLM ?? 0;
    lines.push("");
    lines.push("Summary:");
    lines.push(`  Events: ${tree.metadata.totalEvents}`);
    lines.push(`  Tools: ${tools}`);
    lines.push(`  LLMs: ${llms}`);
    lines.push(
      `  Confidence: ${cb.explicit} explicit, ${cb.correlated} correlated, ${cb.heuristic} heuristic, ${cb.unknown} unknown`,
    );
    lines.push("");
    lines.push("Note:");
    lines.push("  Flat timeline by default. Nesting only with explicit parentId.");
  }

  return lines.join("\n");
}

export function renderRunTrees(trees: InspectRunTree[], options?: RenderTreeOptions): string {
  return trees.map((t) => renderRunTree(t, options)).join("\n\n");
}

