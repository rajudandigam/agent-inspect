import type { InspectNode, InspectRunTree } from "agent-inspect/advanced";
import { defineRenderer, type TraceRenderer } from "@agent-inspect/adapter-sdk";

function formatDuration(durationMs: number | undefined): string {
  if (durationMs === undefined || !Number.isFinite(durationMs)) return "-";
  return `${durationMs}ms`;
}

function renderNodes(nodes: readonly InspectNode[], depth: number, lines: string[]): void {
  for (const node of nodes) {
    const ev = node.event;
    const indent = "  ".repeat(depth);
    const status = ev.status ?? "unknown";
    lines.push(
      `${indent}- **${ev.name}** [${ev.kind}] ${status} (${formatDuration(ev.durationMs)})`,
    );
    if (node.children.length > 0) {
      renderNodes(node.children, depth + 1, lines);
    }
  }
}

function collectErrors(nodes: readonly InspectNode[], out: InspectNode[]): void {
  for (const node of nodes) {
    if (node.event.status === "error") out.push(node);
    collectErrors(node.children, out);
  }
}

/**
 * Example TraceRenderer that turns an InspectRunTree into a compact markdown
 * summary. Metadata-only: it renders names, kinds, statuses, and durations,
 * never attribute values, so nothing sensitive is copied into the output.
 */
export const markdownSummaryRenderer: TraceRenderer = defineRenderer({
  format: "markdown-summary",
  render(tree: InspectRunTree) {
    const lines: string[] = [];
    lines.push(`# Run summary: ${tree.name ?? tree.runId}`);
    lines.push("");
    lines.push("| Field | Value |");
    lines.push("| ----- | ----- |");
    lines.push(`| runId | \`${tree.runId}\` |`);
    lines.push(`| status | ${tree.status ?? "unknown"} |`);
    lines.push(`| duration | ${formatDuration(tree.durationMs)} |`);
    lines.push(`| events | ${tree.metadata.totalEvents} |`);
    lines.push("");
    lines.push("## Steps");
    lines.push("");
    if (tree.children.length > 0) {
      renderNodes(tree.children, 0, lines);
    } else {
      lines.push("(no steps recorded)");
    }

    const errors: InspectNode[] = [];
    collectErrors(tree.children, errors);
    if (errors.length > 0) {
      lines.push("");
      lines.push("## Errors");
      lines.push("");
      for (const node of errors) {
        lines.push(`- **${node.event.name}** (\`${node.event.eventId}\`)`);
      }
    }

    return {
      content: lines.join("\n"),
      contentType: "text/markdown",
      warnings: [],
    };
  },
});
