import {
  buildRunWhatSummary,
  readTraceEvents,
  renderRunWhat,
  resolveTraceDir,
} from "@agent-inspect/core";

export interface WhatCommandOptions {
  dir?: string;
  json?: boolean;
  /** Omit correlation metadata from human output. */
  noCorrelation?: boolean;
}

export async function whatCommand(
  runId: string,
  options: WhatCommandOptions = {},
): Promise<void> {
  const id =
    typeof runId === "string" && runId.trim() !== "" ? runId.trim() : "";
  if (id === "") {
    console.error("Run id is required");
    process.exitCode = 1;
    return;
  }

  const traceDir = resolveTraceDir({ dir: options.dir });
  let events;
  try {
    events = await readTraceEvents(id, traceDir);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[AgentInspect] what failed: ${msg}`);
    process.exitCode = 1;
    return;
  }

  if (events.length === 0) {
    console.log(`Run not found: ${id}`);
    console.log(`Trace directory: ${traceDir}`);
    process.exitCode = 1;
    return;
  }

  const summary = buildRunWhatSummary(events);

  if (options.json) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  console.log(renderRunWhat(summary, { correlation: !options.noCorrelation }));
}
