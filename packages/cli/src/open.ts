import { stat } from "node:fs/promises";

import {
  formatDuration,
  formatTimestamp,
  getIndent,
  type InspectNode,
  type InspectRunTree,
} from "@agent-inspect/core/advanced";
import {
  TraceReadError,
  openTrace,
  type TraceInput,
  type TraceReadResult,
  type TraceReadWarning,
} from "@agent-inspect/core/readers";

export interface OpenCommandOptions {
  format?: string;
  json?: boolean;
  diagnostics?: boolean;
  run?: string;
}

export interface OpenCommandJsonOutput {
  format?: string;
  sourceFiles?: string[];
  unsupportedFields?: string[];
  warnings?: TraceReadWarning[];
  selectedRunId?: string;
  runs?: InspectRunTree[];
  error?: {
    code?: string;
    message: string;
  };
}

async function readStdin(stdin: NodeJS.ReadableStream): Promise<string> {
  stdin.setEncoding("utf8");
  let content = "";
  for await (const chunk of stdin) {
    content += typeof chunk === "string" ? chunk : String(chunk);
  }
  return content;
}

async function inputFromPathOrStdin(
  input: string | undefined,
  stdin: NodeJS.ReadableStream,
): Promise<TraceInput> {
  if (input === undefined || input === "-") {
    return { type: "string", content: await readStdin(stdin) };
  }

  const stats = await stat(input);
  if (stats.isDirectory()) return { type: "directory", path: input };
  return { type: "file", path: input };
}

function printWarnings(result: Pick<TraceReadResult, "warnings" | "unsupportedFields">): void {
  if (result.warnings.length === 0 && result.unsupportedFields.length === 0) {
    return;
  }
  console.log("");
  console.log("Diagnostics");
  for (const warning of result.warnings) {
    const where = [
      warning.sourceFile,
      warning.line !== undefined ? `line ${warning.line}` : undefined,
      warning.field,
    ].filter((value) => value !== undefined).join(" ");
    console.log(
      `- ${warning.code}: ${warning.message}${where !== "" ? ` (${where})` : ""}`,
    );
  }
  for (const field of result.unsupportedFields) {
    console.log(`- unsupported: ${field}`);
  }
}

function printNode(node: InspectNode, depth: number): void {
  const ev = node.event;
  const status = ev.status !== undefined ? ` ${ev.status}` : "";
  const duration =
    ev.durationMs !== undefined ? ` ${formatDuration(ev.durationMs)}` : "";
  console.log(`${getIndent(depth)}${ev.kind.toLowerCase()}: ${ev.name}${status}${duration}`);
  for (const child of node.children) {
    printNode(child, depth + 1);
  }
}

function printRun(result: TraceReadResult, run: InspectRunTree): void {
  console.log(`Format: ${result.format}`);
  console.log(`Run: ${run.runId}`);
  if (run.name !== undefined) console.log(`Name: ${run.name}`);
  if (run.status !== undefined) console.log(`Status: ${run.status}`);
  if (run.startedAt !== undefined) {
    console.log(`Started: ${formatTimestamp(run.startedAt)}`);
  }
  if (run.durationMs !== undefined) {
    console.log(`Duration: ${formatDuration(run.durationMs)}`);
  }
  console.log(`Events: ${run.metadata.totalEvents}`);
  for (const node of run.children) {
    printNode(node, 0);
  }
}

function selectRun(
  result: TraceReadResult,
  runId?: string,
): InspectRunTree | undefined {
  if (runId !== undefined) {
    return result.runs.find((run) => run.runId === runId);
  }
  return result.runs.length === 1 ? result.runs[0] : undefined;
}

function printMultipleRuns(result: TraceReadResult): void {
  console.error(
    `Trace contains ${result.runs.length} runs. Re-run with --run <run-id>.`,
  );
  for (const run of result.runs) {
    const bits = [
      run.runId,
      run.name !== undefined ? `name=${run.name}` : undefined,
      run.status !== undefined ? `status=${run.status}` : undefined,
      `events=${run.metadata.totalEvents}`,
    ].filter((value) => value !== undefined);
    console.error(`- ${bits.join(" ")}`);
  }
}

function writeJson(output: OpenCommandJsonOutput): void {
  console.log(JSON.stringify(output, null, 2));
}

/**
 * Opens any local trace format supported by the canonical reader pipeline.
 * User-facing errors set `process.exitCode` without throwing.
 */
export async function openCommand(
  input: string | undefined,
  options: OpenCommandOptions = {},
  stdin: NodeJS.ReadableStream = process.stdin,
): Promise<void> {
  try {
    const traceInput = await inputFromPathOrStdin(input, stdin);
    const result = await openTrace(traceInput, {
      ...(options.format !== undefined ? { format: options.format } : {}),
    });
    const selected = selectRun(result, options.run);

    if (selected === undefined) {
      process.exitCode = 1;
      const message =
        options.run !== undefined
          ? `Run not found: ${options.run}`
          : `Trace contains ${result.runs.length} runs. Specify --run <run-id>.`;
      if (options.json) {
        writeJson({
          format: result.format,
          sourceFiles: result.sourceFiles,
          warnings: result.warnings,
          unsupportedFields: result.unsupportedFields,
          runs: result.runs,
          error: { message },
        });
      } else if (options.run !== undefined) {
        console.error(message);
      } else {
        printMultipleRuns(result);
      }
      return;
    }

    if (options.json) {
      writeJson({
        format: result.format,
        sourceFiles: result.sourceFiles,
        warnings: result.warnings,
        unsupportedFields: result.unsupportedFields,
        selectedRunId: selected.runId,
        runs: [selected],
      });
      return;
    }

    printRun(result, selected);
    if (options.diagnostics) {
      printWarnings(result);
    }
  } catch (error) {
    process.exitCode = 1;
    const message = error instanceof Error ? error.message : String(error);
    const code = error instanceof TraceReadError ? error.code : undefined;
    const warnings = error instanceof TraceReadError ? error.warnings : [];
    if (options.json) {
      writeJson({
        warnings,
        error: { ...(code !== undefined ? { code } : {}), message },
      });
      return;
    }
    console.error(message);
    if (options.diagnostics) {
      printWarnings({ warnings, unsupportedFields: [] });
    }
  }
}
