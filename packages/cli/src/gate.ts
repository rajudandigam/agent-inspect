import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  gateHasThresholds,
  parseGateList,
  renderGateReport,
  resolveTraceDir,
  runGate,
} from "@agent-inspect/core/advanced";

import { loadSessionRuns } from "./sessions-load.js";

export interface GateCommandOptions {
  dir?: string;
  suite?: string;
  maxErrorRate?: string;
  maxP95Duration?: string;
  forbidTool?: string | string[];
  requireObservation?: string | string[];
  json?: boolean;
  format?: "markdown" | "json" | "html" | "junit" | "github";
  output?: string;
  cwd?: string;
}

const SUPPORTED_FORMATS = new Set(["markdown", "json", "html", "junit", "github"]);

function collectList(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  const items = Array.isArray(value) ? value : [value];
  return items.flatMap((item) => parseGateList(item));
}

function parseRate(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === "") return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid --max-error-rate: ${value}`);
  }
  return parsed;
}

function parseDuration(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === "") return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid --max-p95-duration: ${value}`);
  }
  return parsed;
}

async function writeArtifacts(
  result: Awaited<ReturnType<typeof runGate>>,
  outputDir: string,
): Promise<Record<string, string>> {
  await mkdir(outputDir, { recursive: true });
  const paths = {
    jsonPath: path.join(outputDir, "gate-results.json"),
    markdownPath: path.join(outputDir, "gate-summary.md"),
    htmlPath: path.join(outputDir, "gate-report.html"),
    junitPath: path.join(outputDir, "junit.xml"),
    githubPath: path.join(outputDir, "github-step-summary.md"),
  };
  await writeFile(
    paths.jsonPath,
    `${renderGateReport(result, { format: "json" })}\n`,
    "utf-8",
  );
  await writeFile(
    paths.markdownPath,
    `${renderGateReport(result, { format: "markdown" })}\n`,
    "utf-8",
  );
  await writeFile(
    paths.htmlPath,
    `${renderGateReport(result, { format: "html" })}\n`,
    "utf-8",
  );
  await writeFile(
    paths.junitPath,
    `${renderGateReport(result, { format: "junit" })}\n`,
    "utf-8",
  );
  await writeFile(
    paths.githubPath,
    `${renderGateReport(result, { format: "github" })}\n`,
    "utf-8",
  );
  return paths;
}

export async function gateCommand(options: GateCommandOptions = {}): Promise<void> {
  try {
    const format = options.format ?? (options.json ? "json" : "markdown");
    if (!SUPPORTED_FORMATS.has(format)) {
      if (options.json) {
        console.log(
          JSON.stringify({ ok: false, exitCode: 4, error: `Unsupported format: ${format}` }, null, 2),
        );
      } else {
        console.error(`[AgentInspect] Unsupported format: ${format}`);
      }
      process.exitCode = 4;
      return;
    }

    const gateOptions: import("@agent-inspect/core/advanced").RunGateOptions = {
      ...(options.dir !== undefined ? { traceDir: resolveTraceDir({ dir: options.dir }) } : {}),
      ...(options.suite !== undefined ? { suitePath: options.suite } : {}),
      ...(options.cwd !== undefined ? { cwd: options.cwd } : {}),
      ...(parseRate(options.maxErrorRate) !== undefined
        ? { maxErrorRate: parseRate(options.maxErrorRate) }
        : {}),
      ...(parseDuration(options.maxP95Duration) !== undefined
        ? { maxP95DurationMs: parseDuration(options.maxP95Duration) }
        : {}),
      forbidTools: collectList(options.forbidTool),
      requireObservations: collectList(options.requireObservation),
    };

    let runs: Awaited<ReturnType<typeof loadSessionRuns>>["runs"] = [];
    const needsRuns =
      gateHasThresholds(gateOptions) ||
      (gateOptions.traceDir !== undefined && gateOptions.suitePath === undefined);
    if (needsRuns) {
      const traceDir = gateOptions.traceDir ?? resolveTraceDir({ dir: options.dir });
      const loaded = await loadSessionRuns(traceDir);
      runs = loaded.runs;
      gateOptions.traceDir = traceDir;
    }

    const result = await runGate(runs, gateOptions);

    let artifacts: Record<string, string> | undefined;
    if (options.output !== undefined && options.output.trim() !== "") {
      artifacts = await writeArtifacts(result, path.resolve(options.output.trim()));
    }

    if (options.json || format === "json") {
      console.log(JSON.stringify({ ...result, artifacts: artifacts ?? null }, null, 2));
    } else if (format === "html") {
      console.log(renderGateReport(result, { format: "html" }));
    } else if (format === "junit") {
      console.log(renderGateReport(result, { format: "junit" }));
    } else if (format === "github") {
      console.log(renderGateReport(result, { format: "github" }));
    } else {
      console.log(renderGateReport(result, { format: "markdown" }));
      if (artifacts !== undefined) {
        console.log("");
        console.log("Artifacts:");
        for (const value of Object.values(artifacts)) console.log(`- ${value}`);
      }
    }

    process.exitCode = result.exitCode;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (options.json) {
      console.log(JSON.stringify({ ok: false, exitCode: 2, error: message }, null, 2));
    } else {
      console.error(`[AgentInspect] gate failed: ${message}`);
    }
    process.exitCode = 2;
  }
}
