import { escapeHtml } from "../exporters/helpers.js";
import type { CohortAnalysisResult, RenderCohortReportOptions } from "./types.js";

function formatRate(value: number | undefined): string {
  if (value === undefined) return "n/a";
  return `${(value * 100).toFixed(1)}%`;
}

export function renderCohortSummaryMarkdown(result: CohortAnalysisResult): string {
  const lines: string[] = [];
  lines.push("# Cohort analysis");
  lines.push("");
  lines.push(`Trace directory: \`${result.traceDir}\``);
  lines.push(`Group by: \`${result.groupBy}\``);
  if (result.baseline !== undefined && result.candidate !== undefined) {
    lines.push(
      `Baseline/Candidate key: \`${result.cohortKey}\` (${result.baseline} vs ${result.candidate})`,
    );
  }
  lines.push(`Status: **${result.ok ? "PASS" : "REGRESSION"}**`);
  lines.push("");

  if (result.warnings.length > 0) {
    lines.push("## Warnings");
    for (const warning of result.warnings) lines.push(`- ${warning}`);
    lines.push("");
  }

  lines.push("## Groups");
  for (const group of result.groups) {
    lines.push(
      `### ${group.cohortLabel ?? "all"} / ${group.groupKey} (${group.runCount} runs)`,
    );
    lines.push(`- Error rate: ${formatRate(group.errorRate)}`);
    if (group.avgDurationMs !== undefined) {
      lines.push(`- Avg duration: ${Math.round(group.avgDurationMs)} ms`);
    }
    if (group.dominantToolChoice !== undefined) {
      lines.push(`- Dominant tools: ${group.dominantToolChoice}`);
    }
    lines.push(
      `- Observation failure rate: ${formatRate(group.observationFailureRate)}`,
    );
    lines.push("");
  }

  if (result.comparisons.length > 0) {
    lines.push("## Comparisons");
    for (const comparison of result.comparisons) {
      const flag = comparison.regression ? " **REGRESSION**" : "";
      lines.push(`- ${comparison.message}${flag}`);
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}

export function renderCohortReportHtml(result: CohortAnalysisResult): string {
  const rows = result.groups
    .map(
      (group) =>
        `<tr><td>${escapeHtml(group.cohortLabel ?? "all")}</td><td>${escapeHtml(group.groupKey)}</td><td>${group.runCount}</td><td>${escapeHtml(formatRate(group.errorRate))}</td><td>${group.avgDurationMs !== undefined ? Math.round(group.avgDurationMs) : "n/a"}</td></tr>`,
    )
    .join("");

  const comparisons = result.comparisons
    .map(
      (item) =>
        `<li>${escapeHtml(item.message)}${item.regression ? " <strong>REGRESSION</strong>" : ""}</li>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Cohort report</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 2rem; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; }
    th { background: #f6f6f6; }
  </style>
</head>
<body>
  <h1>Cohort analysis</h1>
  <p>Status: <strong>${result.ok ? "PASS" : "REGRESSION"}</strong></p>
  <p>Trace directory: <code>${escapeHtml(result.traceDir)}</code></p>
  <h2>Groups</h2>
  <table>
    <thead><tr><th>Cohort</th><th>Group</th><th>Runs</th><th>Error rate</th><th>Avg duration (ms)</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  ${result.comparisons.length > 0 ? `<h2>Comparisons</h2><ul>${comparisons}</ul>` : ""}
</body>
</html>`;
}

export function renderCohortReport(
  result: CohortAnalysisResult,
  options: RenderCohortReportOptions = {},
): string {
  const format = options.format ?? "markdown";
  if (format === "json") return JSON.stringify(result, null, 2);
  if (format === "html") return renderCohortReportHtml(result);
  return renderCohortSummaryMarkdown(result);
}
