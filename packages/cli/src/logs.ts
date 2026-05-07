import type { ParserWarning, ParserWarningCode } from "@agent-inspect/core";
import { parseLogsToTrees, renderRunTrees } from "@agent-inspect/core";

export interface LogsOptions {
  format?: "json" | "log4js" | "auto";
  config?: string;
  runIdKey?: string;
  eventKey?: string;
  timestampKey?: string;
  messageKey?: string;
  levelKey?: string;
  parentIdKey?: string;
  durationKey?: string;
  statusKey?: string;
  json?: boolean;
  summary?: boolean;
  warnings?: "none" | "summary" | "all";
  verbose?: boolean;
  color?: boolean;
}

function parseRunIdKeys(raw?: string): string[] | undefined {
  if (typeof raw !== "string") return undefined;
  const parts = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s !== "");
  return parts.length > 0 ? parts : undefined;
}

function summarizeWarnings(warnings: ParserWarning[]): Record<ParserWarningCode, number> {
  const out = {} as Record<ParserWarningCode, number>;
  for (const w of warnings) {
    out[w.code] = (out[w.code] ?? 0) + 1;
  }
  return out;
}

function formatWarningLine(w: ParserWarning): string {
  const loc =
    w.line !== undefined
      ? `line ${w.line}`
      : w.file
        ? "file"
        : "unknown";
  return `- ${loc} ${w.code}: ${w.message}`;
}

export async function logs(filePath: string, options: LogsOptions = {}): Promise<void> {
  try {
    const fp = typeof filePath === "string" ? filePath.trim() : "";
    if (fp === "") {
      console.error("Log file path is required");
      process.exitCode = 1;
      return;
    }

    const warningsMode = options.warnings ?? "summary";
    if (warningsMode !== "none" && warningsMode !== "summary" && warningsMode !== "all") {
      console.error(`Invalid --warnings value: ${String(options.warnings)}`);
      process.exitCode = 1;
      return;
    }

    const res = await parseLogsToTrees(fp, {
      format: options.format ?? "auto",
      configPath: options.config,
      runIdKeys: parseRunIdKeys(options.runIdKey),
      eventKey: options.eventKey,
      timestampKey: options.timestampKey,
      messageKey: options.messageKey,
      levelKey: options.levelKey,
      parentIdKey: options.parentIdKey,
      durationKey: options.durationKey,
      statusKey: options.statusKey,
      warnings: warningsMode,
    });

    const summary = {
      runs: res.trees.length,
      events: res.events.length,
      warnings: res.warnings.length,
    };

    const hasOutput = res.events.length > 0 && res.trees.length > 0;

    if (options.json) {
      const payload =
        warningsMode === "none"
          ? { events: res.events, trees: res.trees, warnings: [], summary }
          : { ...res, summary };
      console.log(JSON.stringify(payload, null, 2));
      if (!hasOutput) process.exitCode = 1;
      return;
    }

    // Human output
    if (!hasOutput) {
      console.error("No valid events found.");
      process.exitCode = 1;
    } else {
      const treeText = renderRunTrees(res.trees, {
        summary: options.summary ?? true,
        showConfidence: "always",
      });
      console.log(treeText);
    }

    if (warningsMode === "none") return;

    const warnings = res.warnings;
    const counts = summarizeWarnings(warnings);
    console.log("");
    console.log("Warnings:");
    console.log(`  Total: ${warnings.length}`);
    if (warningsMode === "summary") {
      for (const [code, count] of Object.entries(counts)) {
        console.log(`  ${code}: ${count}`);
      }
      return;
    }

    for (const w of warnings) {
      console.log(formatWarningLine(w));
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[AgentInspect] logs failed: ${msg}`);
    process.exitCode = 1;
  }
}

