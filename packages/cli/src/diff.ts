import type { DiffOptions } from "@agent-inspect/core";
import {
  diffTraceEvents,
  parseDuration,
  readTraceEvents,
  renderRunDiff,
  resolveTraceDir,
} from "@agent-inspect/core";

export interface DiffCommandOptions {
  dir?: string;
  json?: boolean;
  ignoreDuration?: boolean;
  durationThreshold?: string;
  focus?: "all" | "errors" | "structure" | "outputs";
  check?: "all" | "structure" | "outputs" | "errors" | "timing";
  verbose?: boolean;
}

function parseFocus(s: string | undefined): DiffOptions["focus"] {
  const v = (s ?? "all").trim().toLowerCase();
  if (v === "all" || v === "errors" || v === "structure" || v === "outputs") {
    return v;
  }
  throw new Error(
    `Invalid --focus "${s ?? ""}". Use all, errors, structure, or outputs.`,
  );
}

function parseCheck(s: string | undefined): DiffOptions["check"] {
  const v = (s ?? "all").trim().toLowerCase();
  if (
    v === "all" ||
    v === "structure" ||
    v === "outputs" ||
    v === "errors" ||
    v === "timing"
  ) {
    return v;
  }
  throw new Error(
    `Invalid --check "${s ?? ""}". Use all, structure, outputs, errors, or timing.`,
  );
}

export async function diffCommand(
  leftRunId: string,
  rightRunId: string,
  options: DiffCommandOptions = {},
): Promise<void> {
  const leftId =
    typeof leftRunId === "string" && leftRunId.trim() !== ""
      ? leftRunId.trim()
      : "";
  const rightId =
    typeof rightRunId === "string" && rightRunId.trim() !== ""
      ? rightRunId.trim()
      : "";
  if (leftId === "" || rightId === "") {
    console.error("Both left and right run ids are required");
    process.exitCode = 1;
    return;
  }

  let focus: DiffOptions["focus"];
  let check: DiffOptions["check"];
  try {
    focus = parseFocus(options.focus);
    check = parseCheck(options.check);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(msg);
    process.exitCode = 1;
    return;
  }

  let durationThresholdMs: number | undefined;
  if (options.durationThreshold !== undefined && options.durationThreshold.trim() !== "") {
    try {
      durationThresholdMs = parseDuration(options.durationThreshold.trim());
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`Invalid --duration-threshold: ${msg}`);
      process.exitCode = 1;
      return;
    }
  }

  const traceDir = resolveTraceDir({ dir: options.dir });

  let leftEvents;
  let rightEvents;
  try {
    leftEvents = await readTraceEvents(leftId, traceDir);
    rightEvents = await readTraceEvents(rightId, traceDir);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[AgentInspect] diff failed: ${msg}`);
    process.exitCode = 1;
    return;
  }

  if (leftEvents.length === 0) {
    console.error(
      `Run not found or trace is empty: ${leftId}\nTrace directory: ${traceDir}`,
    );
    process.exitCode = 1;
    return;
  }
  if (rightEvents.length === 0) {
    console.error(
      `Run not found or trace is empty: ${rightId}\nTrace directory: ${traceDir}`,
    );
    process.exitCode = 1;
    return;
  }

  const diffOpts: DiffOptions = {
    ignoreDuration: options.ignoreDuration === true,
    durationThresholdMs,
    focus,
    check,
  };

  let result;
  try {
    result = diffTraceEvents(leftEvents, rightEvents, diffOpts);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[AgentInspect] diff failed: ${msg}`);
    process.exitCode = 1;
    return;
  }

  if (options.json === true) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(
    renderRunDiff(result, {
      verbose: options.verbose === true,
      color: false,
      json: false,
    }),
  );
}
