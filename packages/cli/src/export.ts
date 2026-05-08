import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { ExportFormat, ExportOptions } from "@agent-inspect/core";
import {
  exportRunTree,
  manualTraceEventsToRunTree,
  readTraceEvents,
  resolveTraceDir,
  validateExport,
} from "@agent-inspect/core";

export interface ExportCommandOptions {
  dir?: string;
  format?: string;
  output?: string;
  json?: boolean;
  validate?: boolean;
  includeAttributes?: boolean;
  noMetadata?: boolean;
  noErrors?: boolean;
}

function parseExportFormat(s: string | undefined): ExportFormat {
  const v = (s ?? "markdown").trim().toLowerCase();
  if (
    v === "markdown" ||
    v === "html" ||
    v === "openinference" ||
    v === "otlp-json"
  ) {
    return v;
  }
  throw new Error(
    `Unsupported --format "${s ?? ""}". Use markdown, html, openinference, or otlp-json.`,
  );
}

export async function exportCommand(
  runId: string,
  options: ExportCommandOptions = {},
): Promise<void> {
  const id =
    typeof runId === "string" && runId.trim() !== "" ? runId.trim() : "";
  if (id === "") {
    console.error("Run id is required");
    process.exitCode = 1;
    return;
  }

  let format: ExportFormat;
  try {
    format = parseExportFormat(options.format);
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
    console.error(`[AgentInspect] export failed: ${msg}`);
    process.exitCode = 1;
    return;
  }

  if (events.length === 0) {
    console.error(`Run not found or trace is empty: ${id}\nTrace directory: ${traceDir}`);
    process.exitCode = 1;
    return;
  }

  let tree;
  try {
    tree = manualTraceEventsToRunTree(events);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[AgentInspect] export failed: ${msg}`);
    process.exitCode = 1;
    return;
  }

  const exportOpts: ExportOptions = {
    format,
    includeMetadata: options.noMetadata === true ? false : true,
    includeAttributes: options.includeAttributes === true,
    includeErrors: options.noErrors === true ? false : true,
    pretty: true,
    redacted: true,
    maxAttributeLength: 500,
  };

  const result = exportRunTree(tree, exportOpts);
  const validation =
    options.validate === true ? validateExport(result) : undefined;

  if (validation !== undefined && !validation.ok) {
    process.exitCode = 1;
  }

  const outPath =
    options.output !== undefined && options.output.trim() !== ""
      ? path.resolve(options.output.trim())
      : undefined;

  if (outPath !== undefined) {
    await mkdir(path.dirname(outPath), { recursive: true });
    await writeFile(outPath, result.content, "utf-8");
    const vlabel =
      validation !== undefined ? (validation.ok ? "ok" : "failed") : "skipped";
    console.log(`Wrote ${result.fileExtension} export to ${outPath} (validation: ${vlabel})`);
    if (validation !== undefined && !validation.ok) {
      console.error("Validation errors:", validation.errors.join("; "));
    }
  }

  if (options.json === true) {
    const payload: Record<string, unknown> = {
      format: result.format,
      contentType: result.contentType,
      fileExtension: result.fileExtension,
      warnings: [...result.warnings, ...(validation?.warnings ?? [])],
      validation,
    };
    if (outPath === undefined) {
      payload.content = result.content;
    }
    console.log(JSON.stringify(payload, null, 2));
    if (validation !== undefined && !validation.ok) {
      console.error("Validation errors:", validation.errors.join("; "));
    }
  } else if (outPath === undefined) {
    console.log(result.content);
    if (options.validate === true && validation !== undefined) {
      if (validation.ok) {
        console.error(`Validation: ok (${validation.warnings.length} warning(s))`);
      } else {
        console.error("Validation failed:", validation.errors.join("; "));
      }
      if (validation.warnings.length > 0) {
        console.error("Warnings:", validation.warnings.join("; "));
      }
    }
  }
}
