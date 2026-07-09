import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  COHORT_METRIC_IDS,
  analyzeCohort,
  parseCohortMetricList,
  renderCohortReport,
  resolveTraceDir,
  type CohortMetricId,
} from "@agent-inspect/core/advanced";

import { loadSessionRuns } from "./sessions-load.js";

export interface CohortCommandOptions {
  dir?: string;
  baseline?: string;
  candidate?: string;
  cohortKey?: string;
  groupBy?: string;
  metric?: string;
  json?: boolean;
  format?: "markdown" | "json" | "html";
  output?: string;
}

function normalizeMetrics(raw: string | undefined): CohortMetricId[] | undefined {
  const parsed = parseCohortMetricList(raw);
  if (parsed.length === 0) return undefined;
  const allowed = new Set(COHORT_METRIC_IDS);
  return parsed.filter((item): item is CohortMetricId =>
    allowed.has(item as CohortMetricId),
  );
}

async function writeArtifacts(
  result: Awaited<ReturnType<typeof analyzeCohort>>,
  outputDir: string,
): Promise<{ jsonPath: string; markdownPath: string; htmlPath: string }> {
  await mkdir(outputDir, { recursive: true });
  const jsonPath = path.join(outputDir, "cohort-results.json");
  const markdownPath = path.join(outputDir, "cohort-summary.md");
  const htmlPath = path.join(outputDir, "cohort-report.html");
  await writeFile(jsonPath, `${renderCohortReport(result, { format: "json" })}\n`, "utf-8");
  await writeFile(
    markdownPath,
    `${renderCohortReport(result, { format: "markdown" })}\n`,
    "utf-8",
  );
  await writeFile(htmlPath, `${renderCohortReport(result, { format: "html" })}\n`, "utf-8");
  return { jsonPath, markdownPath, htmlPath };
}

export async function cohortCommand(options: CohortCommandOptions = {}): Promise<void> {
  try {
    const traceDir = resolveTraceDir({ dir: options.dir });
    const { runs } = await loadSessionRuns(traceDir);
    const result = await analyzeCohort(runs, {
      traceDir,
      baseline: options.baseline,
      candidate: options.candidate,
      cohortKey: options.cohortKey,
      groupBy: options.groupBy,
      metrics: normalizeMetrics(options.metric),
    });

    const format = options.format ?? (options.json ? "json" : "markdown");
    let artifacts: { jsonPath: string; markdownPath: string; htmlPath: string } | undefined;
    if (options.output !== undefined && options.output.trim() !== "") {
      artifacts = await writeArtifacts(result, path.resolve(options.output.trim()));
    }

    if (options.json || format === "json") {
      console.log(
        JSON.stringify(
          {
            ...result,
            artifacts: artifacts ?? null,
          },
          null,
          2,
        ),
      );
    } else if (format === "html") {
      console.log(renderCohortReport(result, { format: "html" }));
      if (artifacts !== undefined) {
        console.error(`Artifacts written to ${options.output}`);
      }
    } else {
      console.log(renderCohortReport(result, { format: "markdown" }));
      if (artifacts !== undefined) {
        console.log("");
        console.log(`Artifacts:`);
        console.log(`- ${artifacts.jsonPath}`);
        console.log(`- ${artifacts.markdownPath}`);
        console.log(`- ${artifacts.htmlPath}`);
      }
    }

    if (!result.ok) process.exitCode = 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (options.json) {
      console.log(JSON.stringify({ ok: false, error: message }, null, 2));
    } else {
      console.error(`[AgentInspect] cohort failed: ${message}`);
    }
    process.exitCode = 1;
  }
}
