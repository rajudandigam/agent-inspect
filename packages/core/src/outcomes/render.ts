import type { ObservedOutcome, ObservedOutcomeSummary } from "./types.js";

function formatPayload(value: unknown): string {
  if (value === undefined) return "";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function renderObservedOutcomesMarkdown(summary: ObservedOutcomeSummary): string {
  if (summary.total === 0) {
    return "No observed outcomes recorded for this run.";
  }
  const lines = [
    `Total: ${summary.total} (passed ${summary.passed}, failed ${summary.failed}, unknown ${summary.unknown}, skipped ${summary.skipped})`,
    "",
    "| Name | Status | Expectation | Method |",
    "| --- | --- | --- | --- |",
  ];
  for (const outcome of summary.outcomes) {
    lines.push(
      `| ${outcome.name} | ${outcome.status} | ${outcome.expectation.replace(/\|/g, "\\|")} | ${outcome.method ?? "-"} |`,
    );
  }
  return lines.join("\n");
}

export function renderObservedOutcomesText(summary: ObservedOutcomeSummary): string {
  if (summary.total === 0) {
    return "No observed outcomes recorded for this run.";
  }
  const lines = [
    `Observed outcomes: ${summary.total} (passed ${summary.passed}, failed ${summary.failed}, unknown ${summary.unknown}, skipped ${summary.skipped})`,
  ];
  for (const outcome of summary.outcomes) {
    const evidence = formatPayload(outcome.evidence);
    const suffix = evidence ? ` evidence=${evidence}` : "";
    lines.push(
      `- ${outcome.name} [${outcome.status}] ${outcome.expectation}${suffix}`,
    );
  }
  return lines.join("\n");
}

export function renderObservedOutcomesHtml(summary: ObservedOutcomeSummary): string {
  if (summary.total === 0) {
    return "<p>No observed outcomes recorded for this run.</p>";
  }
  const rows = summary.outcomes
    .map((outcome: ObservedOutcome) => {
      const esc = (v: string) =>
        v.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
      return `<tr><td>${esc(outcome.name)}</td><td>${esc(outcome.status)}</td><td>${esc(outcome.expectation)}</td><td>${esc(outcome.method ?? "-")}</td></tr>`;
    })
    .join("");
  return `<p>Total: ${summary.total} (passed ${summary.passed}, failed ${summary.failed}, unknown ${summary.unknown}, skipped ${summary.skipped})</p><table><thead><tr><th>Name</th><th>Status</th><th>Expectation</th><th>Method</th></tr></thead><tbody>${rows}</tbody></table>`;
}
