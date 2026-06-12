import {
  TraceDirectory,
  buildTraceStats,
  extractMetadata,
  parseDuration,
  renderTraceStats,
  resolveTraceDir,
} from "@agent-inspect/core";

export interface StatsCommandOptions {
  dir?: string;
  since?: string;
  json?: boolean;
  correlationId?: string;
  groupId?: string;
}

export async function statsCommand(
  options: StatsCommandOptions = {},
): Promise<void> {
  try {
    const traceDir = resolveTraceDir({ dir: options.dir });
    const td = new TraceDirectory({ dir: traceDir });

    if (typeof options.since === "string" && options.since.trim() !== "") {
      parseDuration(options.since.trim());
    }

    const files = await td.list();
    if (files.length === 0) {
      if (options.json) {
        console.log(
          JSON.stringify({
            traceDir,
            totalRuns: 0,
            successCount: 0,
            errorCount: 0,
            runningCount: 0,
            unknownCount: 0,
            errorRate: 0,
            duration: {},
            totalSteps: 0,
            avgStepsPerRun: 0,
            totalLlmSteps: 0,
            totalToolSteps: 0,
            totalErrorSteps: 0,
            slowestRuns: [],
            slowestSteps: [],
          }),
        );
      } else {
        console.log("No AgentInspect runs found");
        console.log(`Trace directory: ${traceDir}`);
      }
      return;
    }

    const metas = [];
    for (const fileName of files) {
      try {
        metas.push(await extractMetadata(td.getPath(fileName)));
      } catch {
        /* skip */
      }
    }

    const stats = await buildTraceStats(metas, {
      traceDir,
      since: options.since,
      correlationId: options.correlationId,
      groupId: options.groupId,
    });

    if (options.json) {
      console.log(JSON.stringify(stats, null, 2));
      return;
    }

    console.log(renderTraceStats(stats));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[AgentInspect] stats failed: ${msg}`);
    process.exitCode = 1;
  }
}
