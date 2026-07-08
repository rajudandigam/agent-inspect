import type { BundleCheckResults, BundleMetadata, BundleRedactionReport } from "./types.js";

function markdownTable(rows: readonly [string, string | number | undefined][]): string {
  const lines = ["| Field | Value |", "| --- | --- |"];
  for (const [key, value] of rows) {
    lines.push(`| ${key} | ${value ?? "unknown"} |`);
  }
  return lines.join("\n");
}

/**
 * Builds a human-readable bundle summary for `summary.md`.
 */
export function buildBundleSummaryMarkdown(parts: {
  metadata: BundleMetadata;
  checks: BundleCheckResults;
  redaction: BundleRedactionReport;
}): string {
  const { metadata, checks, redaction } = parts;
  const lines: string[] = [
    "# AgentInspect trace bundle",
    "",
    metadata.note,
    "",
    "## Overview",
    "",
    markdownTable([
      ["Created", metadata.createdAt],
      ["AgentInspect", metadata.agentInspectVersion],
      ["Redaction profile", metadata.redactionProfile],
      ["Safe status", metadata.safeStatus],
      ["Source traces", metadata.sourceTraceCount],
      ["Runs", metadata.runIds.join(", ")],
      ...(metadata.sessionId ? [["Session", metadata.sessionId] as [string, string]] : []),
      ...(metadata.since ? [["Since", metadata.since] as [string, string]] : []),
    ]),
    "",
    "## Safety checks",
    "",
    `Aggregate: **${checks.aggregateStatus}**`,
    "",
  ];

  for (const run of checks.runs) {
    lines.push(
      `- \`${run.runId}\`: ${run.status} (${run.findings} finding(s), ${run.errors} error(s), ${run.warnings} warning(s))`,
    );
  }

  lines.push("", "## Redaction", "", `Total findings: ${redaction.totalFindings}`, "");
  for (const run of redaction.runs) {
    const detectors = run.detectors.length > 0 ? run.detectors.join(", ") : "none";
    lines.push(`- \`${run.runId}\`: ${run.findings} finding(s); detectors: ${detectors}`);
  }

  lines.push(
    "",
    "## Files",
    "",
    ...metadata.files.map((file) => `- \`${file}\``),
    "",
    "_Review every generated artifact before sharing outside your team._",
    "",
  );

  return lines.join("\n");
}
