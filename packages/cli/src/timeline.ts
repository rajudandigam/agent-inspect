import {
  buildRunTimeline,
  readTraceEvents,
  renderTimeline,
  resolveTraceDir,
} from "@agent-inspect/core";

export interface TimelineCommandOptions {
  dir?: string;
  json?: boolean;
  focus?: string;
}

export async function timelineCommand(
  runId: string,
  options: TimelineCommandOptions = {},
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
    console.error(`[AgentInspect] timeline failed: ${msg}`);
    process.exitCode = 1;
    return;
  }

  if (events.length === 0) {
    console.log(`Run not found: ${id}`);
    console.log(`Trace directory: ${traceDir}`);
    process.exitCode = 1;
    return;
  }

  const focus =
    options.focus?.trim().toLowerCase() === "slow" ? "slow" : "all";

  const timeline = buildRunTimeline(events, {
    focus: focus === "slow" ? "slow" : "all",
  });

  if (options.json) {
    console.log(JSON.stringify(timeline, null, 2));
    return;
  }

  console.log(renderTimeline(timeline, { focus }));
}
