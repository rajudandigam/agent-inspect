#!/usr/bin/env node
import { realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Command, Option } from "commander";

import type { ListOptions } from "./list.js";
import { list } from "./list.js";
import type { CleanOptions } from "./clean.js";
import { clean } from "./clean.js";
import type { ViewOptions } from "./view.js";
import { view } from "./view.js";
import type { LogsOptions } from "./logs.js";
import { logs } from "./logs.js";
import type { TailOptions } from "./tail.js";
import { tail } from "./tail.js";
import type { ExportCommandOptions } from "./export.js";
import { exportCommand } from "./export.js";
import type { DiffCommandOptions } from "./diff.js";
import { diffCommand } from "./diff.js";
import type { TimelineCommandOptions } from "./timeline.js";
import { timelineCommand } from "./timeline.js";
import type { StatsCommandOptions } from "./stats.js";
import { statsCommand } from "./stats.js";
import type { SearchCommandOptions } from "./search.js";
import { searchCommand } from "./search.js";
import type { WhatCommandOptions } from "./what.js";
import { whatCommand } from "./what.js";
import type { ReportCommandOptions } from "./report.js";
import { reportCommand } from "./report.js";

export function runCommand(action: () => Promise<void>): void {
  void action().catch((error: unknown) => {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[AgentInspect] ${msg}`);
    process.exitCode = 1;
  });
}

export function createCliProgram(): Command {
  const program = new Command("agent-inspect")
    .description("Local-first execution-tree debugger for AI agents")
    .version("1.0.0");

  program
    .command("list")
    .description("List recent AgentInspect runs")
    .option("--dir <path>", "trace directory")
    .option("--limit <number>", "max runs to show (default 20, max 100)")
    .addOption(
      new Option("--status <status>", "filter by run status").choices([
        "running",
        "success",
        "error",
        "unknown",
      ]),
    )
    .option("--name <query>", "filter by run name or id (substring match)")
    .option(
      "--since <duration>",
      "only include runs since a duration (e.g. 30s, 5m, 2h, 7d)",
    )
    .option("--json", "print runs as JSON")
    .action(
      (opts: {
        dir?: string;
        limit?: string;
        status?: ListOptions["status"];
        name?: string;
        since?: string;
        json?: boolean;
      }) => {
        runCommand(() => list(opts));
      },
    );

  program
    .command("view")
    .description("View a single run trace")
    .argument("<run-id>", "run id (e.g. from list output)")
    .option("--dir <path>", "trace directory")
    .option("--summary", "print a run summary (counts, duration, max depth)")
    .option("--metadata", "print trace metadata (file path/size, timestamps)")
    .option("--errors-only", "show only error events / failed steps")
    .option("--verbose", "show extra detail (types, metadata, error stacks)")
    .option("--json", "print raw trace events as JSON")
    .option(
      "--tui",
      "open optional interactive TUI viewer (requires @agent-inspect/tui)",
    )
    .action(
      (
        runId: string,
        opts: ViewOptions,
      ) => {
        runCommand(() => view(runId, opts));
      },
    );

  program
    .command("clean")
    .description("Safely delete old AgentInspect run traces")
    .option("--dir <path>", "trace directory")
    .option(
      "--older-than <duration>",
      "delete runs older than a duration (e.g. 30s, 5m, 2h, 7d)",
    )
    .option("--keep <count>", "keep N most recent runs (delete the rest)")
    .option("--dry-run", "print what would be deleted (no changes)")
    .option("--yes", "skip confirmation prompt")
    .action(
      (opts: {
        dir?: string;
        olderThan?: string;
        keep?: string;
        dryRun?: boolean;
        yes?: boolean;
      }) => {
        runCommand(() => clean(opts satisfies CleanOptions));
      },
    );

  program
    .command("logs")
    .description("Parse structured logs into execution trees")
    .argument("<file>", "path to log file")
    .addOption(
      new Option("--format <format>", "log format").choices([
        "auto",
        "json",
        "log4js",
      ]),
    )
    .option("--config <path>", "path to log ingest config (JSON)")
    .option(
      "--run-id-key <keys>",
      "override run id keys (comma-separated, e.g. decisionId,requestId,jobId)",
    )
    .option("--event-key <key>", "override event key")
    .option("--timestamp-key <key>", "override timestamp key")
    .option("--message-key <key>", "override message key")
    .option("--level-key <key>", "override level key")
    .option("--parent-id-key <key>", "override parent id key")
    .option("--duration-key <key>", "override duration key")
    .option("--status-key <key>", "override status key")
    .option("--json", "print result as JSON")
    .option("--summary", "include summary section in human output")
    .addOption(
      new Option("--warnings <mode>", "warning output mode").choices([
        "summary",
        "all",
        "none",
      ]),
    )
    .option("--verbose", "show more detail (reserved for future)")
    .option("--no-color", "disable color output")
    .action((file: string, opts: LogsOptions) => {
      runCommand(() => logs(file, opts));
    });

  program
    .command("tail")
    .description("Live tail structured logs into execution trees")
    .option("--file <path>", "tail a log file (default: read from stdin)")
    .addOption(
      new Option("--format <format>", "log format").choices([
        "auto",
        "json",
        "log4js",
      ]),
    )
    .option("--config <path>", "path to log ingest config (JSON)")
    .option(
      "--run-id-key <keys>",
      "override run id keys (comma-separated, e.g. decisionId,requestId,jobId)",
    )
    .option("--event-key <key>", "override event key")
    .option("--timestamp-key <key>", "override timestamp key")
    .option("--message-key <key>", "override message key")
    .option("--level-key <key>", "override level key")
    .option("--parent-id-key <key>", "override parent id key")
    .option("--duration-key <key>", "override duration key")
    .option("--status-key <key>", "override status key")
    .addOption(
      new Option("--warnings <mode>", "warning output mode").choices([
        "summary",
        "all",
        "none",
      ]),
    )
    .option("--refresh <ms>", "minimum time between renders (ms)")
    .option("--once", "read once and exit (for --file)")
    .option("--json", "print newline-delimited JSON updates")
    .option("--no-clear", "do not clear screen between renders")
    .option("--verbose", "show more detail (reserved for future)")
    .option("--no-color", "disable color output")
    .action((opts: TailOptions) => {
      runCommand(() => tail(opts));
    });

  program
    .command("export")
    .description("Export a manual trace run (Markdown, HTML, OpenInference-compatible JSON, OTLP JSON)")
    .argument("<run-id>", "run id (e.g. from list output)")
    .option("--dir <path>", "trace directory")
    .addOption(
      new Option("--format <format>", "export format (default: markdown)").choices([
        "markdown",
        "html",
        "openinference",
        "otlp-json",
      ]),
    )
    .option("-o, --output <path>", "write export to file (creates parent dirs)")
    .option("--json", "emit JSON wrapper about the export (includes content when writing to stdout)")
    .option("--validate", "validate exported payload shape after generation")
    .option("--include-attributes", "include bounded attributes (review before sharing)")
    .option("--no-metadata", "omit summary / metadata sections")
    .option("--no-errors", "omit error sections")
    .addOption(
      new Option(
        "--redaction-profile <profile>",
        "redaction profile for exported copies: local, share, strict (default: local)",
      ).choices(["local", "share", "strict"]),
    )
    .action((runId: string, opts: ExportCommandOptions) => {
      runCommand(() => exportCommand(runId, opts));
    });

  program
    .command("diff")
    .description("Compare two local AgentInspect JSONL traces (read-only)")
    .argument("<left-run-id>", "first run id")
    .argument("<right-run-id>", "second run id")
    .option("--dir <path>", "trace directory")
    .option("--json", "print diff result as JSON")
    .option("--ignore-duration", "omit duration comparisons")
    .option(
      "--duration-threshold <duration>",
      "ignore duration deltas at or below this (e.g. 500ms, 2s, 1m)",
    )
    .addOption(
      new Option("--focus <scope>", "limit categories shown").choices([
        "all",
        "errors",
        "structure",
        "outputs",
      ]),
    )
    .addOption(
      new Option("--check <scope>", "limit categories compared").choices([
        "all",
        "structure",
        "outputs",
        "errors",
        "timing",
      ]),
    )
    .option("--verbose", "show more left/right detail")
    .action((leftRunId: string, rightRunId: string, opts: DiffCommandOptions) => {
      runCommand(() => diffCommand(leftRunId, rightRunId, opts));
    });

  program
    .command("timeline")
    .description("Chronological timeline for a single run (local JSONL)")
    .argument("<run-id>", "run id (e.g. from list output)")
    .option("--dir <path>", "trace directory")
    .option("--json", "print timeline as JSON")
    .addOption(
      new Option("--focus <mode>", "highlight slowest steps by duration").choices([
        "slow",
      ]),
    )
    .action((runId: string, opts: TimelineCommandOptions) => {
      runCommand(() => timelineCommand(runId, opts));
    });

  program
    .command("stats")
    .description("Local aggregate stats over trace files (read-only)")
    .option("--dir <path>", "trace directory")
    .option("--since <duration>", "only include runs since a duration (e.g. 7d)")
    .option("--correlation-id <id>", "filter by run_started.metadata.correlationId")
    .option("--group-id <id>", "filter by run_started.metadata.groupId")
    .option("--json", "print stats as JSON")
    .action((opts: StatsCommandOptions) => {
      runCommand(() => statsCommand(opts));
    });

  program
    .command("search")
    .description("Deterministic local search over trace files (read-only)")
    .option("--dir <path>", "trace directory")
    .option("--since <duration>", "only search runs since a duration")
    .addOption(
      new Option("--status <status>", "filter by run or step status").choices([
        "success",
        "error",
        "running",
        "unknown",
      ]),
    )
    .option("--kind <kind>", "filter by step kind/type (llm, tool, logic, …)")
    .option("--type <type>", "alias for --kind on manual trace step type")
    .option("--name <query>", "substring match on run or step name")
    .option("--tool <query>", "substring match on tool step name or metadata.toolName")
    .option(
      "--duration <expr>",
      "duration filter on run or step (e.g. >5s, >=500ms)",
    )
    .option("--limit <number>", "max results (default 50)")
    .option("--json", "print results as JSON")
    .action((opts: SearchCommandOptions) => {
      runCommand(() => searchCommand(opts));
    });

  program
    .command("what")
    .description("Concise human-readable summary of a single run (local JSONL)")
    .argument("<run-id>", "run id (e.g. from list output)")
    .option("--dir <path>", "trace directory")
    .option("--json", "print structured summary as JSON")
    .option("--no-correlation", "omit correlation metadata from human output")
    .action((runId: string, opts: WhatCommandOptions) => {
      runCommand(() => whatCommand(runId, opts));
    });

  program
    .command("report")
    .description("Generate markdown or HTML inspection report for a single run")
    .argument("<run-id>", "run id (e.g. from list output)")
    .option("--dir <path>", "trace directory")
    .addOption(
      new Option("--format <format>", "report format (default: markdown)").choices([
        "markdown",
        "html",
      ]),
    )
    .option("-o, --output <path>", "write report to file (creates parent dirs)")
    .option("--json", "emit JSON wrapper (includes content when writing to stdout)")
    .option("--include-attributes", "include bounded step attributes in tree section")
    .option("--no-errors", "omit error details from tree section")
    .option("--no-correlation", "omit correlation metadata from what section")
    .addOption(
      new Option(
        "--redaction-profile <profile>",
        "redaction profile for tree section: local, share, strict (default: local)",
      ).choices(["local", "share", "strict"]),
    )
    .action((runId: string, opts: ReportCommandOptions) => {
      runCommand(() => reportCommand(runId, opts));
    });

  return program;
}

function isPrimaryModule(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  const selfPath = fileURLToPath(import.meta.url);
  try {
    return (
      realpathSync(path.resolve(entry)) === realpathSync(path.resolve(selfPath))
    );
  } catch {
    return path.resolve(entry) === path.resolve(selfPath);
  }
}

if (isPrimaryModule()) {
  createCliProgram().parse(process.argv);
}
