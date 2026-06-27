import {
  buildLocalExplanation,
  type ExplainMode,
  type ExplainResult,
  type InspectRunTree,
  type RedactionProfile,
} from "@agent-inspect/core";
import {
  TraceReadError,
  openTrace,
  type TraceReadResult,
} from "@agent-inspect/core/readers";

import { inputFromTarget } from "./trace-input.js";

export interface ExplainCommandOptions {
  dir?: string;
  format?: string;
  run?: string;
  dryRun?: boolean;
  json?: boolean;
  provider?: string;
  redactionProfile?: string;
}

function parseRedactionProfile(value: string | undefined): RedactionProfile {
  const profile = (value ?? "local").trim().toLowerCase();
  if (profile === "local" || profile === "share" || profile === "strict") {
    return profile;
  }
  throw new Error(
    `Unsupported --redaction-profile "${value ?? ""}". Use local, share, or strict.`,
  );
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
    console.error(`- ${run.runId}${run.name !== undefined ? ` name=${run.name}` : ""}`);
  }
}

function renderHuman(result: ExplainResult): string {
  const lines = [
    `Explain: ${result.name ?? result.runId}`,
    `Mode: ${result.mode}`,
    `Status: ${result.status ?? "unknown"}`,
    `Redaction: ${result.redactionProfile}`,
    "",
    "Facts:",
  ];
  for (const fact of result.facts) {
    lines.push(`- ${fact.id}: ${JSON.stringify(fact.value)}`);
  }
  lines.push("", "Inferences:");
  if (result.inferences.length === 0) {
    lines.push("- none");
  } else {
    for (const inference of result.inferences) {
      lines.push(`- ${inference.label}: ${inference.text}`);
    }
  }
  lines.push("", "Notes:");
  for (const note of result.notes) {
    lines.push(`- ${note}`);
  }
  return lines.join("\n");
}

function writeJson(result: unknown): void {
  console.log(JSON.stringify(result, null, 2));
}

function rejectProvider(provider: string, json: boolean | undefined): void {
  process.exitCode = 1;
  const message =
    `Provider explain is not implemented in this build: ${provider}. ` +
    "Use --dry-run to inspect the redacted local payload.";
  if (json) {
    writeJson({
      ok: false,
      error: { code: "PROVIDER_NOT_IMPLEMENTED", message },
    });
    return;
  }
  console.error(message);
}

export async function explainCommand(
  target: string,
  options: ExplainCommandOptions = {},
  stdin: NodeJS.ReadableStream = process.stdin,
): Promise<void> {
  if (options.provider !== undefined) {
    rejectProvider(options.provider, options.json);
    return;
  }

  let redactionProfile: RedactionProfile;
  try {
    redactionProfile = parseRedactionProfile(options.redactionProfile);
  } catch (error) {
    process.exitCode = 1;
    console.error(error instanceof Error ? error.message : String(error));
    return;
  }

  try {
    const input = await inputFromTarget(target, options, stdin);
    const read = await openTrace(input, {
      ...(options.format !== undefined ? { format: options.format } : {}),
    });
    const selected = selectRun(read, options.run);
    if (selected === undefined) {
      process.exitCode = 1;
      const message =
        options.run !== undefined
          ? `Run not found: ${options.run}`
          : `Trace contains ${read.runs.length} runs. Specify --run <run-id>.`;
      if (options.json) {
        writeJson({ ok: false, error: { message }, runs: read.runs });
      } else if (options.run !== undefined) {
        console.error(message);
      } else {
        printMultipleRuns(read);
      }
      return;
    }

    const mode: ExplainMode = options.dryRun ? "dry-run" : "local";
    const explanation = buildLocalExplanation(selected, {
      mode,
      redactionProfile,
    });

    if (options.json) {
      writeJson({
        ok: true,
        format: read.format,
        sourceFiles: read.sourceFiles,
        warnings: read.warnings,
        unsupportedFields: read.unsupportedFields,
        explanation,
      });
      return;
    }

    console.log(renderHuman(explanation));
  } catch (error) {
    process.exitCode = 1;
    const message = error instanceof Error ? error.message : String(error);
    const code = error instanceof TraceReadError ? error.code : undefined;
    if (options.json) {
      writeJson({
        ok: false,
        error: { ...(code !== undefined ? { code } : {}), message },
      });
      return;
    }
    console.error(message);
  }
}
