import type { InspectNode, InspectRunTree } from "../types/inspect-event.js";

import type { ExportOptions, ExportResult } from "./types.js";
import {
  compactAttributes,
  escapeMarkdown,
  flattenTree,
  safeString,
  stableJson,
} from "./helpers.js";
import { presentLifecycleJoinedTree } from "./presentation-lifecycle.js";

function renderTreeAscii(nodes: InspectNode[], indent = ""): string {
  const lines: string[] = [];
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i]!;
    const last = i === nodes.length - 1;
    const branch = last ? "└─ " : "├─ ";
    const ev = n.event;
    const status = ev.status ?? "?";
    const dur =
      ev.durationMs !== undefined && Number.isFinite(ev.durationMs)
        ? `${ev.durationMs}ms`
        : "-";
    lines.push(`${indent}${branch}${escapeMarkdown(ev.name)} [${ev.kind}] ${status} (${dur})`);
    const nextIndent = indent + (last ? "   " : "│  ");
    if (n.children.length > 0) {
      const childStr = renderTreeAscii(n.children, nextIndent);
      if (childStr.length > 0) lines.push(childStr);
    }
  }
  return lines.join("\n");
}

export function exportMarkdown(
  tree: InspectRunTree,
  options?: Partial<ExportOptions>,
): ExportResult {
  const warnings: string[] = [];
  const includeMetadata = options?.includeMetadata ?? true;
  const includeAttributes = options?.includeAttributes ?? false;
  const includeErrors = options?.includeErrors ?? true;
  const maxLen = options?.maxAttributeLength ?? 500;
  const redacted = options?.redacted ?? true;
  const view = presentLifecycleJoinedTree(tree);

  const titleName = view.name ?? view.runId;
  const lines: string[] = [];
  lines.push(`# AgentInspect Run: ${escapeMarkdown(titleName)}`);
  lines.push("");
  lines.push("Generated locally by AgentInspect. Review for sensitive data before sharing.");
  lines.push("");

  if (includeMetadata) {
    lines.push("## Summary");
    lines.push("");
    lines.push(`- **runId**: ${escapeMarkdown(view.runId)}`);
    if (view.name !== undefined) lines.push(`- **name**: ${escapeMarkdown(view.name)}`);
    lines.push(`- **status**: ${escapeMarkdown(String(view.status ?? "unknown"))}`);
    lines.push(
      `- **durationMs**: ${view.durationMs !== undefined ? escapeMarkdown(String(view.durationMs)) : "-"}`,
    );
    lines.push(
      `- **startedAt**: ${view.startedAt !== undefined ? escapeMarkdown(String(view.startedAt)) : "-"}`,
    );
    lines.push(
      `- **endedAt**: ${view.endedAt !== undefined ? escapeMarkdown(String(view.endedAt)) : "-"}`,
    );
    lines.push(`- **totalEvents**: ${view.metadata.totalEvents}`);
    lines.push("");
    lines.push("### Confidence breakdown");
    lines.push("");
    lines.push("| bucket | count |");
    lines.push("| --- | --- |");
    for (const k of Object.keys(view.metadata.confidenceBreakdown).sort()) {
      const key = k as keyof typeof view.metadata.confidenceBreakdown;
      lines.push(
        `| ${escapeMarkdown(key)} | ${view.metadata.confidenceBreakdown[key]} |`,
      );
    }
    lines.push("");
    lines.push("### Kind breakdown");
    lines.push("");
    lines.push("| kind | count |");
    lines.push("| --- | --- |");
    for (const k of Object.keys(view.metadata.kinds).sort()) {
      const key = k as keyof typeof view.metadata.kinds;
      const c = view.metadata.kinds[key];
      if (c > 0) lines.push(`| ${escapeMarkdown(key)} | ${c} |`);
    }
    lines.push("");
  }

  lines.push("## Execution tree");
  lines.push("");
  lines.push("```text");
  lines.push(
    view.children.length > 0 ? renderTreeAscii(view.children) : "(no steps)",
  );
  lines.push("```");
  lines.push("");

  const flat = flattenTree(view);
  const errors = flat.filter((n) => n.event.status === "error");
  if (includeErrors && errors.length > 0) {
    lines.push("## Errors");
    lines.push("");
    for (const n of errors) {
      const msg =
        n.event.attributes && typeof n.event.attributes.error === "object"
          ? safeString(
              (n.event.attributes.error as { message?: string }).message,
              maxLen,
            )
          : "";
      lines.push(
        `- **${escapeMarkdown(n.event.name)}** (${escapeMarkdown(n.event.eventId)}): ${escapeMarkdown(msg || "error")}`,
      );
    }
    lines.push("");
  }

  if (includeAttributes) {
    lines.push("## Attributes (bounded)");
    lines.push("");
    for (const n of flat) {
      if (!n.event.attributes || Object.keys(n.event.attributes).length === 0) continue;
      const compact = compactAttributes(n.event.attributes, {
        maxLength: maxLen,
        redacted,
      });
      lines.push(`### ${escapeMarkdown(n.event.name)}`);
      lines.push("");
      lines.push("```json");
      lines.push(stableJson(compact, true));
      lines.push("```");
      lines.push("");
    }
    warnings.push(
      "Attributes may still contain sensitive data; review exports before sharing.",
    );
  }

  return {
    format: "markdown",
    content: lines.join("\n"),
    contentType: "text/markdown",
    fileExtension: ".md",
    warnings,
  };
}
