import type { RenderSuiteReportOptions, SuiteRunResult } from "./types.js";

function statusLabel(status: string): string {
  return status.toUpperCase();
}

export function renderSuiteReportMarkdown(result: SuiteRunResult): string {
  const lines: string[] = [];
  lines.push(`# Suite: ${result.suiteName}`);
  lines.push("");
  lines.push(`Status: **${statusLabel(result.status)}**`);
  lines.push(`Config: \`${result.configPath}\``);
  lines.push(`Traces: \`${result.tracesDir}\``);
  lines.push(`Started: ${result.startedAt}`);
  lines.push(`Finished: ${result.finishedAt}`);
  lines.push("");
  lines.push("## Summary");
  lines.push(`- Passed: ${result.summary.passed}`);
  lines.push(`- Failed: ${result.summary.failed}`);
  lines.push(`- Errors: ${result.summary.errors}`);
  lines.push(`- Skipped: ${result.summary.skipped}`);
  lines.push("");
  lines.push("## Cases");
  for (const suiteCase of result.cases) {
    lines.push(`### ${suiteCase.id} — ${statusLabel(suiteCase.status)}`);
    if (suiteCase.tracePath !== undefined) {
      lines.push(`- Trace: \`${suiteCase.tracePath}\``);
    }
    if (suiteCase.runId !== undefined) {
      lines.push(`- Run: \`${suiteCase.runId}\``);
    }
    if (suiteCase.message !== undefined && suiteCase.message.trim() !== "") {
      lines.push(`- ${suiteCase.message}`);
    }
    if (suiteCase.diagnostics.length > 0) {
      for (const item of suiteCase.diagnostics) {
        lines.push(`- [${item.severity}] ${item.message}`);
      }
    }
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

export function renderSuiteReport(
  result: SuiteRunResult,
  options: RenderSuiteReportOptions = {},
): string {
  const format = options.format ?? "markdown";
  if (format === "json") {
    return JSON.stringify(result, null, 2);
  }
  return renderSuiteReportMarkdown(result);
}
