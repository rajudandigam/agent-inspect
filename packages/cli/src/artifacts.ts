import { appendFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  TraceReadError,
  openTrace,
  type TraceReadResult,
} from "@agent-inspect/core/readers";
import {
  createBaselineRegressionRule,
  createSafetyOversizedAttributeRule,
  createSafetyRawContentRule,
  createSafetyRedactionRule,
  createSafetySecretPatternRule,
  runTraceChecks,
  type TraceCheckResult,
  type TraceCheckRule,
} from "@agent-inspect/core/checks";

import { inputFromTarget } from "./trace-input.js";

export interface ArtifactsCommandOptions {
  dir?: string;
  format?: string;
  run?: string;
  outputDir?: string;
  baseline?: string;
  baselineRun?: string;
  githubSummary?: string;
  json?: boolean;
}

type SelectedRun = TraceReadResult["runs"][number];

interface SafeTraceSummary {
  format: string;
  runId?: string;
  runStatus?: string;
  runDurationMs?: number;
  runCount: number;
  eventCount: number;
  eventsByKind: Record<string, number>;
  eventsByStatus: Record<string, number>;
  readerWarnings: number;
  unsupportedFields: number;
}

interface ArtifactManifest {
  status: "ok" | "unsafe" | "regression" | "warning" | "unknown";
  outputDir: string;
  files: string[];
  trace: SafeTraceSummary;
  check: {
    status: TraceCheckResult["status"];
    findings: number;
    diagnostics: number;
  };
  diff: {
    status: TraceCheckResult["status"] | "not_requested";
    findings: number;
    diagnostics: number;
  };
  githubSummary?: string;
  note: string;
}

const NOTE =
  "Generated locally by AgentInspect. Artifacts are best-effort summaries, not compliance or security certification.";

const SAFETY_RULES: TraceCheckRule[] = [
  createSafetyRawContentRule(),
  createSafetyRedactionRule(),
  createSafetySecretPatternRule(),
  createSafetyOversizedAttributeRule({
    maxStringLength: 16_384,
    maxArrayLength: 1_000,
    maxObjectKeys: 200,
    maxSerializedBytes: 128 * 1024,
  }),
];

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value === null || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  return Object.fromEntries(
    Object.keys(record)
      .sort((a, b) => a.localeCompare(b))
      .map((key) => [key, stable(record[key])]),
  );
}

function writeJson(value: unknown): string {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function markdownTable(rows: readonly [string, string | number | undefined][]): string {
  const lines = ["| Field | Value |", "| --- | --- |"];
  for (const [key, value] of rows) {
    lines.push(`| ${key} | ${value ?? "unknown"} |`);
  }
  return lines.join("\n");
}

function increment(record: Record<string, number>, key: string | undefined): void {
  const label = key && key.trim() !== "" ? key : "unknown";
  record[label] = (record[label] ?? 0) + 1;
}

function selectRun(read: TraceReadResult, runId: string | undefined): SelectedRun | undefined {
  if (runId !== undefined) {
    return read.runs.find((run) => run.runId === runId);
  }
  return read.runs.length === 1 ? read.runs[0] : undefined;
}

function summarizeTrace(read: TraceReadResult, run: SelectedRun | undefined): SafeTraceSummary {
  const runId = run?.runId;
  const scopedEvents =
    runId === undefined ? read.events : read.events.filter((event) => event.runId === runId);
  const eventsByKind: Record<string, number> = {};
  const eventsByStatus: Record<string, number> = {};
  for (const event of scopedEvents) {
    increment(eventsByKind, event.kind);
    increment(eventsByStatus, event.status);
  }
  return {
    format: read.format,
    ...(runId !== undefined ? { runId } : {}),
    ...(run?.status !== undefined ? { runStatus: run.status } : {}),
    ...(run?.durationMs !== undefined ? { runDurationMs: run.durationMs } : {}),
    runCount: read.runs.length,
    eventCount: scopedEvents.length,
    eventsByKind: Object.fromEntries(Object.entries(eventsByKind).sort()),
    eventsByStatus: Object.fromEntries(Object.entries(eventsByStatus).sort()),
    readerWarnings: read.warnings.length,
    unsupportedFields: read.unsupportedFields.length,
  };
}

function renderCheckSection(result: TraceCheckResult): string {
  const lines = [
    `Status: ${result.status}`,
    `Findings: ${result.findings.length}`,
    `Diagnostics: ${result.diagnostics.length}`,
  ];
  for (const finding of result.findings.slice(0, 10)) {
    const path = finding.evidence[0]?.path ?? "(run)";
    lines.push(`- ${finding.ruleId}: ${finding.message} (${path})`);
  }
  for (const diagnostic of result.diagnostics.slice(0, 10)) {
    lines.push(`- ${diagnostic.code}: ${diagnostic.message}`);
  }
  return lines.join("\n");
}

function renderMarkdown(
  trace: SafeTraceSummary,
  check: TraceCheckResult,
  diff: TraceCheckResult | undefined,
): string {
  const lines = [
    "# AgentInspect CI Artifacts",
    "",
    NOTE,
    "",
    "## Trace",
    "",
    markdownTable([
      ["Format", trace.format],
      ["Run", trace.runId],
      ["Run status", trace.runStatus],
      ["Run duration ms", trace.runDurationMs],
      ["Runs", trace.runCount],
      ["Events", trace.eventCount],
      ["Reader warnings", trace.readerWarnings],
      ["Unsupported fields", trace.unsupportedFields],
    ]),
    "",
    "## Safety check",
    "",
    "```text",
    renderCheckSection(check),
    "```",
    "",
    "## Baseline diff",
    "",
  ];
  if (diff) {
    lines.push("```text", renderCheckSection(diff), "```", "");
  } else {
    lines.push("No baseline was supplied.", "");
  }
  return lines.join("\n");
}

function renderHtml(
  trace: SafeTraceSummary,
  check: TraceCheckResult,
  diff: TraceCheckResult | undefined,
): string {
  const rows = [
    ["Format", trace.format],
    ["Run", trace.runId],
    ["Run status", trace.runStatus],
    ["Run duration ms", trace.runDurationMs],
    ["Runs", trace.runCount],
    ["Events", trace.eventCount],
    ["Reader warnings", trace.readerWarnings],
    ["Unsupported fields", trace.unsupportedFields],
  ] as const;
  const table = rows
    .map(
      ([key, value]) =>
        `<tr><th>${escapeHtml(key)}</th><td>${escapeHtml(String(value ?? "unknown"))}</td></tr>`,
    )
    .join("");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>AgentInspect CI Artifacts</title>
<style>body{font-family:system-ui,sans-serif;line-height:1.5;margin:1.5rem;max-width:960px;color:#111}table{border-collapse:collapse}th,td{border:1px solid #ddd;padding:0.35rem 0.5rem;text-align:left}pre{white-space:pre-wrap;background:#f8f8f8;padding:0.75rem;overflow:auto}</style>
</head>
<body>
<h1>AgentInspect CI Artifacts</h1>
<p>${escapeHtml(NOTE)}</p>
<h2>Trace</h2>
<table><tbody>${table}</tbody></table>
<h2>Safety check</h2>
<pre>${escapeHtml(renderCheckSection(check))}</pre>
<h2>Baseline diff</h2>
<pre>${escapeHtml(diff ? renderCheckSection(diff) : "No baseline was supplied.")}</pre>
</body>
</html>
`;
}

async function writeArtifact(
  outputDir: string,
  relativePath: string,
  content: string,
  files: string[],
): Promise<void> {
  const outPath = path.join(outputDir, relativePath);
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, content, "utf-8");
  files.push(relativePath);
}

function readErrorMessage(error: unknown): string {
  if (error instanceof TraceReadError) return error.message;
  return error instanceof Error ? error.message : String(error);
}

function manifestStatus(
  check: TraceCheckResult,
  diff: TraceCheckResult | undefined,
): ArtifactManifest["status"] {
  if (check.status === "error" || diff?.status === "error") return "unknown";
  if (check.status === "fail") return "unsafe";
  if (diff?.status === "fail") return "regression";
  if (check.summary.warnings > 0 || (diff?.summary.warnings ?? 0) > 0) return "warning";
  return "ok";
}

export async function artifactsCommand(
  target: string,
  options: ArtifactsCommandOptions = {},
  stdin: NodeJS.ReadableStream = process.stdin,
): Promise<void> {
  const outputDir =
    options.outputDir !== undefined && options.outputDir.trim() !== ""
      ? path.resolve(options.outputDir.trim())
      : "";
  if (outputDir === "") {
    console.error("--output-dir is required.");
    process.exitCode = 1;
    return;
  }

  let read: TraceReadResult;
  try {
    const input = await inputFromTarget(target, options, stdin);
    read = await openTrace(input, {
      ...(options.format !== undefined ? { format: options.format } : {}),
    });
  } catch (error) {
    console.error(`[AgentInspect] artifacts failed: ${readErrorMessage(error)}`);
    process.exitCode = 1;
    return;
  }

  const selectedRun = selectRun(read, options.run);
  const check = runTraceChecks(
    { read },
    {
      rules: SAFETY_RULES,
      ...(options.run !== undefined ? { runId: options.run } : {}),
    },
  );
  const trace = summarizeTrace(read, selectedRun);

  let diff: TraceCheckResult | undefined;
  if (options.baseline !== undefined && options.baseline.trim() !== "") {
    try {
      const baselineInput = await inputFromTarget(options.baseline, options, stdin);
      const baselineRead = await openTrace(baselineInput, {
        ...(options.format !== undefined ? { format: options.format } : {}),
      });
      diff = runTraceChecks(
        { read },
        {
          rules: [
            createBaselineRegressionRule({
              baseline: { read: baselineRead },
              ...(options.baselineRun !== undefined ? { baselineRunId: options.baselineRun } : {}),
              compareFormat: true,
            }),
          ],
          ...(options.run !== undefined ? { runId: options.run } : {}),
        },
      );
    } catch (error) {
      console.error(`[AgentInspect] baseline diff failed: ${readErrorMessage(error)}`);
      process.exitCode = 1;
      return;
    }
  }

  const files: string[] = [];
  await mkdir(outputDir, { recursive: true });
  await writeArtifact(outputDir, "trace.json", writeJson(trace), files);
  await writeArtifact(outputDir, "check.json", writeJson(check), files);
  await writeArtifact(
    outputDir,
    "diff.json",
    writeJson(diff ?? { status: "not_requested", findings: [], diagnostics: [] }),
    files,
  );
  await writeArtifact(outputDir, "summary.md", renderMarkdown(trace, check, diff), files);
  await writeArtifact(outputDir, "report.html", renderHtml(trace, check, diff), files);

  const summaryTarget = options.githubSummary ?? process.env.GITHUB_STEP_SUMMARY;
  if (summaryTarget !== undefined && summaryTarget.trim() !== "") {
    await mkdir(path.dirname(path.resolve(summaryTarget)), { recursive: true });
    await appendFile(path.resolve(summaryTarget), `\n${renderMarkdown(trace, check, diff)}`, "utf-8");
  }

  const manifestFiles = [...files, "manifest.json"].sort((a, b) => a.localeCompare(b));
  const manifest: ArtifactManifest = {
    status: manifestStatus(check, diff),
    outputDir,
    files: manifestFiles,
    trace,
    check: {
      status: check.status,
      findings: check.findings.length,
      diagnostics: check.diagnostics.length,
    },
    diff: {
      status: diff?.status ?? "not_requested",
      findings: diff?.findings.length ?? 0,
      diagnostics: diff?.diagnostics.length ?? 0,
    },
    ...(summaryTarget !== undefined && summaryTarget.trim() !== ""
      ? { githubSummary: path.resolve(summaryTarget) }
      : {}),
    note: NOTE,
  };
  await writeFile(path.join(outputDir, "manifest.json"), writeJson(manifest), "utf-8");

  if (options.json === true) {
    console.log(writeJson(manifest).trimEnd());
  } else {
    console.log(`Wrote AgentInspect artifacts to ${outputDir}`);
    console.log(`Status: ${manifest.status}`);
    for (const file of manifest.files) {
      console.log(`- ${file}`);
    }
  }
}
