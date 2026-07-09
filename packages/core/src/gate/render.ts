import { escapeHtml } from "../exporters/helpers.js";
import type { GateResult, RenderGateReportOptions } from "./types.js";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function renderGateSummaryMarkdown(result: GateResult): string {
  const lines: string[] = [];
  lines.push("# AgentInspect gate");
  lines.push("");
  lines.push(`Status: **${result.ok ? "PASS" : "FAIL"}** (exit ${result.exitCode})`);
  if (result.traceDir !== undefined) {
    lines.push(`Trace directory: \`${result.traceDir}\``);
  }
  if (result.suitePath !== undefined) {
    lines.push(`Suite config: \`${result.suitePath}\``);
  }
  lines.push(`Runs evaluated: ${result.runCount}`);
  lines.push("");

  if (result.diagnostics.length > 0) {
    lines.push("## Diagnostics");
    for (const item of result.diagnostics) lines.push(`- ${item}`);
    lines.push("");
  }

  lines.push("## Checks");
  for (const check of result.checks) {
    const flag = check.ok ? "PASS" : "FAIL";
    lines.push(`- [${flag}] ${check.name}: ${check.message}`);
  }
  lines.push("");

  return lines.join("\n").trimEnd();
}

export function renderGateGithubStepSummary(result: GateResult): string {
  const lines: string[] = [];
  lines.push(`## AgentInspect gate: ${result.ok ? "PASS" : "FAIL"}`);
  lines.push("");
  lines.push("| Check | Status | Details |");
  lines.push("| --- | --- | --- |");
  for (const check of result.checks) {
    lines.push(
      `| ${check.name} | ${check.ok ? "pass" : "fail"} | ${check.message.replace(/\|/g, "/")} |`,
    );
  }
  if (result.diagnostics.length > 0) {
    lines.push("");
    lines.push("**Diagnostics**");
    for (const item of result.diagnostics) lines.push(`- ${item}`);
  }
  return lines.join("\n").trimEnd();
}

export function renderGateReportHtml(result: GateResult): string {
  const rows = result.checks
    .map(
      (check) =>
        `<tr><td>${escapeHtml(check.name)}</td><td>${check.ok ? "PASS" : "FAIL"}</td><td>${escapeHtml(check.message)}</td></tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Gate report</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 2rem; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; }
    th { background: #f6f6f6; }
  </style>
</head>
<body>
  <h1>AgentInspect gate</h1>
  <p>Status: <strong>${result.ok ? "PASS" : "FAIL"}</strong> (exit ${result.exitCode})</p>
  <h2>Checks</h2>
  <table>
    <thead><tr><th>Check</th><th>Status</th><th>Details</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
}

export function renderGateJUnit(result: GateResult): string {
  const failures = result.checks.filter((check) => !check.ok).length;
  const tests = result.checks.length;
  const cases = result.checks
    .map((check) => {
      if (check.ok) {
        return `    <testcase name="${escapeXml(check.name)}" classname="gate" />`;
      }
      return `    <testcase name="${escapeXml(check.name)}" classname="gate">
      <failure message="${escapeXml(check.message)}">${escapeXml(check.message)}</failure>
    </testcase>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<testsuites tests="${tests}" failures="${failures}" errors="0" time="0">
  <testsuite name="agent-inspect-gate" tests="${tests}" failures="${failures}" errors="0" time="0">
${cases}
  </testsuite>
</testsuites>`;
}

export function renderGateReport(
  result: GateResult,
  options: RenderGateReportOptions = {},
): string {
  const format = options.format ?? "markdown";
  if (format === "json") return JSON.stringify(result, null, 2);
  if (format === "html") return renderGateReportHtml(result);
  if (format === "junit") return renderGateJUnit(result);
  if (format === "github") return renderGateGithubStepSummary(result);
  return renderGateSummaryMarkdown(result);
}
