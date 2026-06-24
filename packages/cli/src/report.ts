import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { RedactionProfile, ReportFormat } from "@agent-inspect/core";
import {
  buildRunReport,
  readTraceEvents,
  resolveTraceDir,
} from "@agent-inspect/core";

export interface ReportCommandOptions {
  dir?: string;
  format?: string;
  output?: string;
  json?: boolean;
  includeAttributes?: boolean;
  noErrors?: boolean;
  noCorrelation?: boolean;
  redactionProfile?: string;
}

function parseReportFormat(s: string | undefined): ReportFormat {
  const v = (s ?? "markdown").trim().toLowerCase();
  if (v === "markdown" || v === "html") {
    return v;
  }
  throw new Error(
    `Unsupported --format "${s ?? ""}". Use markdown or html.`,
  );
}

function parseRedactionProfile(s: string | undefined): RedactionProfile {
  const v = (s ?? "local").trim().toLowerCase();
  if (v === "local" || v === "share" || v === "strict") {
    return v;
  }
  throw new Error(
    `Unsupported --redaction-profile "${s ?? ""}". Use local, share, or strict.`,
  );
}

export async function reportCommand(
  runId: string,
  options: ReportCommandOptions = {},
): Promise<void> {
  const id =
    typeof runId === "string" && runId.trim() !== "" ? runId.trim() : "";
  if (id === "") {
    console.error("Run id is required");
    process.exitCode = 1;
    return;
  }

  let format: ReportFormat;
  let redactionProfile: RedactionProfile;
  try {
    format = parseReportFormat(options.format);
    redactionProfile = parseRedactionProfile(options.redactionProfile);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(msg);
    process.exitCode = 1;
    return;
  }

  const traceDir = resolveTraceDir({ dir: options.dir });
  let events;
  try {
    events = await readTraceEvents(id, traceDir);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[AgentInspect] report failed: ${msg}`);
    process.exitCode = 1;
    return;
  }

  if (events.length === 0) {
    console.log(`Run not found: ${id}`);
    console.log(`Trace directory: ${traceDir}`);
    process.exitCode = 1;
    return;
  }

  const result = buildRunReport(events, {
    format,
    includeAttributes: options.includeAttributes === true,
    includeErrors: options.noErrors !== true,
    redactionProfile,
    correlation: !options.noCorrelation,
  });

  const outPath =
    options.output !== undefined && options.output.trim() !== ""
      ? path.resolve(options.output.trim())
      : undefined;

  if (outPath !== undefined) {
    await mkdir(path.dirname(outPath), { recursive: true });
    await writeFile(outPath, result.content, "utf-8");
    console.log(`Wrote ${result.fileExtension} report to ${outPath}`);
  }

  if (options.json === true) {
    const payload: Record<string, unknown> = {
      format: result.format,
      contentType: result.contentType,
      fileExtension: result.fileExtension,
    };
    if (outPath === undefined) {
      payload.content = result.content;
    } else {
      payload.output = outPath;
    }
    console.log(JSON.stringify(payload, null, 2));
  } else if (outPath === undefined) {
    console.log(result.content);
  }
}
