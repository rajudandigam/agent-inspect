#!/usr/bin/env node
import { realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Command, Option } from "commander";
import { version as packageVersion } from "../../../package.json";

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
import type { SessionsCommandOptions, SessionCommandOptions } from "./sessions.js";
import {
  sessionCommand,
  sessionsActivityCommand,
  sessionsCommand,
  sessionsErrorsCommand,
  sessionsHandoffsCommand,
  sessionsLatestCommand,
  sessionsShowCommand,
} from "./sessions.js";
import type { WhatCommandOptions } from "./what.js";
import { whatCommand } from "./what.js";
import type { ReportCommandOptions } from "./report.js";
import { reportCommand } from "./report.js";
import type { RedactCommandOptions } from "./redact.js";
import { redactCommand } from "./redact.js";
import type { ExplainCommandOptions } from "./explain.js";
import { explainCommand } from "./explain.js";
import type { OpenCommandOptions } from "./open.js";
import { openCommand } from "./open.js";
import type { MigrateCommandOptions } from "./migrate.js";
import { migrateCommand } from "./migrate.js";
import type { CheckCommandOptions } from "./check.js";
import type { ServeCommandOptions } from "./serve.js";
import { checkCommand } from "./check.js";
import { serveCommand } from "./serve.js";
import type { StudioCommandOptions, StudioImportDropOptions, StudioImportGitHubOptions } from "./studio-cmd.js";
import { studioCommand, studioImportDropCommand, studioImportGitHubCommand } from "./studio-cmd.js";
import type { EvalCommandOptions } from "./eval.js";
import { evalCommand } from "./eval.js";
import type { SafetyCommandOptions } from "./safety.js";
import { scanCommand, verifySafeCommand } from "./safety.js";
import type { ArtifactsCommandOptions } from "./artifacts.js";
import { artifactsCommand } from "./artifacts.js";
import type { BundleCommandOptions } from "./bundle.js";
import { bundleCommand } from "./bundle.js";
import type { CiSummaryCommandOptions } from "./ci-summary.js";
import { ciSummaryCommand } from "./ci-summary.js";
import type { InitCommandOptions } from "./init.js";
import { initCommand } from "./init.js";
import type { DoctorCommandOptions } from "./doctor.js";
import { doctorCommand } from "./doctor.js";
import type { IndexCommandOptions } from "./index-cmd.js";
import {
  indexBuildCommand,
  indexCleanCommand,
  indexStatusCommand,
} from "./index-cmd.js";
import type { IndexSqliteCommandOptions } from "./index-sqlite-cmd.js";
import {
  indexSqliteBuildCommand,
  indexSqliteCleanCommand,
  indexSqliteQueryCommand,
  indexSqliteStatusCommand,
} from "./index-sqlite-cmd.js";
import type {
  WorkspaceCommandOptions,
  WorkspaceInitOptions,
  WorkspaceCleanOptions,
} from "./workspace.js";
import {
  workspaceInitCommand,
  workspaceStatusCommand,
  workspaceDoctorCommand,
  workspaceCleanCommand,
  workspacePathCommand,
} from "./workspace.js";
import type {
  SuiteCommandOptions,
  SuiteReportCommandOptions,
} from "./suite.js";
import {
  suiteInitCommand,
  suiteListCommand,
  suiteReportCommand,
  suiteRunCommand,
  suiteValidateCommand,
} from "./suite.js";
import type { CohortCommandOptions } from "./cohort.js";
import { cohortCommand } from "./cohort.js";
import type { GateCommandOptions } from "./gate.js";
import { gateCommand } from "./gate.js";

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
    .version(packageVersion);

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
    .command("open")
    .description("Open any supported local trace through the reader pipeline")
    .argument("[input]", "trace file, directory, or - for stdin")
    .addOption(
      new Option("--format <format>", "trace input format").choices([
        "agent-inspect-jsonl",
        "openinference-json",
        "otlp-json",
      ]),
    )
    .option("--json", "print result as JSON")
    .option("--diagnostics", "print reader warnings and unsupported fields")
    .option("--run <run-id>", "select a run when the trace contains multiple runs")
    .action((input: string | undefined, opts: OpenCommandOptions) => {
      runCommand(() => openCommand(input, opts));
    });

  program
    .command("migrate")
    .description("Migrate a local AgentInspect JSONL trace to a newer schema")
    .argument("<input>", "AgentInspect JSONL trace file")
    .addOption(
      new Option("--to <version>", "target schema version").choices(["1.0"]),
    )
    .option("--dry-run", "summarize migration without writing files")
    .option("-o, --output <path>", "write migrated JSONL to a separate file")
    .option("--force", "replace an existing output file")
    .action((input: string, opts: MigrateCommandOptions) => {
      runCommand(() => migrateCommand(input, opts));
    });

  program
    .command("check")
    .description("Run deterministic checks against a local trace")
    .argument("<trace-path-or-run-id>", "trace file, directory, stdin -, or run id")
    .option("--dir <path>", "trace directory for run-id lookup")
    .addOption(
      new Option("--format <format>", "trace input format").choices([
        "agent-inspect-jsonl",
        "openinference-json",
        "otlp-json",
      ]),
    )
    .option("--run <run-id>", "select a run when the trace contains multiple runs")
    .option("--config <path>", "path to check config (.json, .js, .mjs, .cjs)")
    .option("--json", "print deterministic JSON check result")
    .option("--rule <id>", "select a rule id (repeatable)", (value, previous: string[] = []) => [
      ...previous,
      value,
    ])
    .option("--max-duration-ms <number>", "add run.duration with a max duration")
    .option("--required-tool <name>", "require a tool name (repeatable)", (value, previous: string[] = []) => [
      ...previous,
      value,
    ])
    .option("--forbidden-tool <name>", "forbid a tool name (repeatable)", (value, previous: string[] = []) => [
      ...previous,
      value,
    ])
    .option("--allowed-model <model>", "allow an LLM model (repeatable)", (value, previous: string[] = []) => [
      ...previous,
      value,
    ])
    .option("--max-total-tokens <number>", "add llm.usage with a max total-token budget")
    .option(
      "--max-step-duration <duration>",
      "add run.maxStepDuration (e.g. 30s, 5m)",
    )
    .option("--require-completed", "add run.requireCompleted")
    .option("--detect-stalls", "add run.stall for running or incomplete events")
    .option(
      "--fail-on-observation <status>",
      "fail when observed outcomes match status (passed, failed, unknown, skipped; comma-separated)",
    )
    .option("--session <id>", "check all runs in a workflow session (requires --dir)")
    .option("--group <id>", "check all runs sharing a groupId (requires --dir)")
    .option(
      "--correlate-group",
      "when using --session, also match synthetic group: session keys",
    )
    .option(
      "--guardrails <rule>",
      "run optional guardrail rules (repeatable): banned-phrase, pii-leak, prompt-injection, ...",
      (value, previous: string[] = []) => [...previous, value],
    )
    .option(
      "--circuit <rule>",
      "run optional circuit rules (repeatable): same-tool-repetition, max-retries, ...",
      (value, previous: string[] = []) => [...previous, value],
    )
    .action((target: string, opts: CheckCommandOptions) => {
      runCommand(() => checkCommand(target, opts));
    });

  program
    .command("serve")
    .description("Start optional localhost read-only trace viewer")
    .option("--dir <path>", "trace directory to serve")
    .option("--host <host>", "bind host (default 127.0.0.1)", "127.0.0.1")
    .option("--port <number>", "bind port (default 7337)", "7337")
    .option("--open", "open browser locally when host is localhost")
    .action((opts: ServeCommandOptions) => {
      runCommand(() => serveCommand(opts));
    });

  program
    .command("viewer")
    .description("Start localhost read-only viewer (traces, suite, or workspace) (v5.3+)")
    .option("--dir <path>", "trace directory (trace mode)")
    .option("--suite", "suite evidence mode")
    .option("--workspace", "workspace mode")
    .option("--config <path>", "suite config path (suite mode)")
    .option("--host <host>", "bind host (default 127.0.0.1)", "127.0.0.1")
    .option("--port <number>", "bind port (default 7337)", "7337")
    .option("--open", "open browser locally when host is localhost")
    .action((opts: ServeCommandOptions) => {
      runCommand(() => serveCommand(opts));
    });

  const studioCmd = program
    .command("studio")
    .description(
      "Start self-hosted read-only Studio analyzer (requires @agent-inspect/studio) (v6.0+)",
    )
    .option("--workspace <path>", "studio registry manifest path")
    .option("--db <path>", "studio database path (sqlite file or postgres URL)")
    .option("--host <host>", "bind host (default 127.0.0.1)", "127.0.0.1")
    .option("--port <number>", "bind port (default 7340)", "7340")
    .option("--server", "bind for network access (0.0.0.0; requires explicit opt-in)")
    .option("--auth <mode>", "auth mode: none or basic", "none")
    .option("--password-env <name>", "env var for basic-auth password")
    .option("--ingest <channel>", "enable ingest channel on startup (file-drop)")
    .option("--archive-file-drop", "archive file-drop sources after successful import")
    .option("--open", "open browser locally when host is localhost")
    .action((opts: StudioCommandOptions) => {
      runCommand(() => studioCommand(opts));
    });

  const studioImportCmd = studioCmd
    .command("import")
    .description("Import external evidence into Studio (v6.1+)");

  studioImportCmd
    .command("drop")
    .description("Import allowlisted files from a file-drop directory")
    .option("--workspace <path>", "studio registry manifest path")
    .option("--db <path>", "studio database path (sqlite file or postgres URL)")
    .option("--dir <path>", "file-drop directory (defaults to registry import.fileDropDir)")
    .option("--archive", "move imported files into .imported/ under the drop dir")
    .action((opts: StudioImportDropOptions) => {
      runCommand(() => studioImportDropCommand(opts));
    });

  studioImportCmd
    .command("github")
    .description("Download a GitHub Actions artifact into the studio import dirs")
    .requiredOption("--repo <owner/name>", "GitHub repository")
    .requiredOption("--run-id <id>", "workflow run id")
    .requiredOption("--artifact <name>", "artifact name")
    .option("--workspace <path>", "studio registry manifest path")
    .option("--db <path>", "studio database path (sqlite file or postgres URL)")
    .option("--token-env <name>", "env var for GitHub token (default GITHUB_TOKEN)")
    .action((opts: StudioImportGitHubOptions) => {
      runCommand(() => studioImportGitHubCommand(opts));
    });

  program
    .command("eval")
    .description("Run deterministic local evals against a trace")
    .argument("<trace-path-or-run-id>", "trace file, directory, stdin -, or run id")
    .option("--dir <path>", "trace directory for run-id lookup")
    .addOption(
      new Option("--format <format>", "trace input format").choices([
        "agent-inspect-jsonl",
        "openinference-json",
        "otlp-json",
      ]),
    )
    .option("--run <run-id>", "select a run when the trace contains multiple runs")
    .option("--config <path>", "path to eval config (.json, .js, .mjs, .cjs)")
    .option("--json", "print deterministic JSON eval result")
    .option("--markdown", "print deterministic Markdown eval summary")
    .option("--require-success", "require the selected run to complete successfully")
    .option("--required-tool <name>", "require a tool name (repeatable)", (value, previous: string[] = []) => [
      ...previous,
      value,
    ])
    .option("--forbid-tool <name>", "forbid a tool name (repeatable)", (value, previous: string[] = []) => [
      ...previous,
      value,
    ])
    .option("--forbidden-tool <name>", "alias for --forbid-tool (repeatable)", (value, previous: string[] = []) => [
      ...previous,
      value,
    ])
    .option("--max-duration-ms <number>", "require run duration at or below this value")
    .option("--max-depth <number>", "require tree depth at or below this value")
    .option("--max-retries <number>", "require retry counts at or below this value")
    .option("--max-total-tokens <number>", "require total LLM tokens at or below this value")
    .option(
      "--require-retrieval-before-generation",
      "require a retrieval step before the first LLM generation",
    )
    .option("--required-decision-metadata <key>", "require decision metadata (repeatable)", (value, previous: string[] = []) => [
      ...previous,
      value,
    ])
    .option("--context-overlap", "require answer/context token overlap")
    .option("--min-context-overlap <number>", "minimum answer/context overlap ratio")
    .option("--min-shared-terms <number>", "minimum shared answer/context terms")
    .option("--quote-overlap", "require quoted answer text to appear in context")
    .option("--citation-presence", "require a citation or source reference")
    .option("--required-source-id <id>", "require a source id in context or citations (repeatable)", (value, previous: string[] = []) => [
      ...previous,
      value,
    ])
    .option("--min-answer-characters <number>", "minimum answer character count")
    .option("--max-answer-characters <number>", "maximum answer character count")
    .option("--min-answer-words <number>", "minimum answer word count")
    .option("--max-answer-words <number>", "maximum answer word count")
    .option("--banned-phrase <text>", "ban unsupported-answer phrasing (repeatable)", (value, previous: string[] = []) => [
      ...previous,
      value,
    ])
    .action((target: string, opts: EvalCommandOptions) => {
      runCommand(() => evalCommand(target, opts));
    });

  program
    .command("scan")
    .description("Best-effort local safety scan for trace capture risks")
    .argument("<trace-path-or-run-id>", "trace file, directory, stdin -, or run id")
    .option("--dir <path>", "trace directory for run-id lookup")
    .addOption(
      new Option("--format <format>", "trace input format").choices([
        "agent-inspect-jsonl",
        "openinference-json",
        "otlp-json",
      ]),
    )
    .option("--run <run-id>", "select a run when the trace contains multiple runs")
    .option("--json", "print deterministic JSON safety result")
    .option("--max-string-length <number>", "unsafe threshold for string values")
    .option("--max-array-length <number>", "unsafe threshold for array values")
    .option("--max-object-keys <number>", "unsafe threshold for object key counts")
    .option("--max-serialized-bytes <number>", "unsafe threshold for serialized values")
    .action((target: string, opts: SafetyCommandOptions) => {
      runCommand(() => scanCommand(target, opts));
    });

  program
    .command("verify-safe")
    .description("Best-effort local trace safety verification")
    .argument("<trace-path-or-run-id>", "trace file, directory, stdin -, or run id")
    .option("--dir <path>", "trace directory for run-id lookup")
    .addOption(
      new Option("--format <format>", "trace input format").choices([
        "agent-inspect-jsonl",
        "openinference-json",
        "otlp-json",
      ]),
    )
    .option("--run <run-id>", "select a run when the trace contains multiple runs")
    .option("--json", "print deterministic JSON safety result")
    .option("--max-string-length <number>", "unsafe threshold for string values")
    .option("--max-array-length <number>", "unsafe threshold for array values")
    .option("--max-object-keys <number>", "unsafe threshold for object key counts")
    .option("--max-serialized-bytes <number>", "unsafe threshold for serialized values")
    .action((target: string, opts: SafetyCommandOptions) => {
      runCommand(() => verifySafeCommand(target, opts));
    });

  program
    .command("artifacts")
    .description("Create safe local CI trace artifacts")
    .argument("<trace-path-or-run-id>", "trace file, directory, stdin -, or run id")
    .requiredOption("--output-dir <path>", "directory for generated artifacts")
    .option("--dir <path>", "trace directory for run-id lookup")
    .addOption(
      new Option("--format <format>", "trace input format").choices([
        "agent-inspect-jsonl",
        "openinference-json",
        "otlp-json",
      ]),
    )
    .option("--run <run-id>", "select a run when the trace contains multiple runs")
    .option("--baseline <trace-path-or-run-id>", "optional baseline trace for diff artifacts")
    .option("--baseline-run <run-id>", "select a run from the baseline trace")
    .option("--github-summary <path>", "append a safe summary to this file, e.g. GITHUB_STEP_SUMMARY")
    .option("--json", "print deterministic JSON manifest")
    .action((target: string, opts: ArtifactsCommandOptions) => {
      runCommand(() => artifactsCommand(target, opts));
    });

  program
    .command("bundle")
    .description("Create a share-safe offline trace bundle (local folder)")
    .argument("[run-id]", "run id to bundle (optional with --session or --since)")
    .option("--dir <path>", "trace directory for run/session lookup")
    .option("--session <session-id>", "bundle all runs in a session")
    .option("--since <duration>", "bundle runs with activity since a duration (e.g. 24h)")
    .addOption(
      new Option("--profile <profile>", "redaction profile for exported copies")
        .choices(["local", "share", "strict"])
        .default("share"),
    )
    .option("--out <path>", "output directory (folder; .zip suffix is stripped)")
    .option("--allow-unsafe", "write bundle even when verify-safe reports UNSAFE")
    .option("--json", "print deterministic JSON manifest")
    .action((runId: string | undefined, opts: BundleCommandOptions) => {
      runCommand(() => bundleCommand(runId, opts));
    });

  program
    .command("ci-summary")
    .description("Summarize local reporter artifact manifests for CI")
    .argument("<manifest...>", "reporter artifact manifest JSON files")
    .option("-o, --output <path>", "write Markdown summary to a local file")
    .option("--github-summary <path>", "append Markdown summary to this local file, e.g. GITHUB_STEP_SUMMARY")
    .option("--json", "print deterministic JSON summary")
    .action((manifest: string[], opts: CiSummaryCommandOptions) => {
      runCommand(() => ciSummaryCommand(manifest, opts));
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
      "--observation <status>",
      "filter by observed outcome status (passed, failed, unknown, skipped)",
    )
    .option(
      "--duration <expr>",
      "duration filter on run or step (e.g. >5s, >=500ms)",
    )
    .option("--limit <number>", "max results (default 50)")
    .option("--session <id>", "limit search to one workflow session")
    .option(
      "--correlate-group",
      "when using --session, also match synthetic group: keys",
    )
    .option("--json", "print results as JSON")
    .action((opts: SearchCommandOptions) => {
      runCommand(() => searchCommand(opts));
    });

  const sessionsCmd = program
    .command("sessions")
    .description(
      "Workflow sessions and activity from local trace metadata (read-only, v4.2+)",
    )
    .option("--dir <path>", "trace directory")
    .option(
      "--correlate-group",
      "treat shared groupId as a synthetic session when sessionId is absent",
    )
    .option("--json", "print JSON output")
    .option(
      "--stale-after <duration>",
      "mark sessions stale after inactivity (e.g. 24h, 7d)",
    )
    .action((opts: SessionsCommandOptions) => {
      runCommand(() => sessionsCommand(opts));
    });

  sessionsCmd
    .command("latest")
    .description("Show the most recently active session")
    .option("--dir <path>", "trace directory")
    .option("--correlate-group", "include synthetic group: sessions")
    .option("--stale-after <duration>", "staleness threshold for status derivation")
    .option("--json", "print JSON result")
    .action((opts: SessionsCommandOptions) => {
      runCommand(() => sessionsLatestCommand(opts));
    });

  sessionsCmd
    .command("activity")
    .description("Summarize recent session activity")
    .option("--dir <path>", "trace directory")
    .option("--since <duration>", "activity window (default 7d)")
    .option("--correlate-group", "include synthetic group: sessions")
    .option("--stale-after <duration>", "staleness threshold for status derivation")
    .option("--json", "print JSON result")
    .action((opts: SessionsCommandOptions) => {
      runCommand(() => sessionsActivityCommand(opts));
    });

  sessionsCmd
    .command("show")
    .description("Show one session (alias for session <id>)")
    .argument("<session-id>", "session id")
    .option("--dir <path>", "trace directory")
    .option("--timeline", "include per-run timelines")
    .option("--critical-path", "include critical path section")
    .option("--diagnostics", "include ambiguity warnings")
    .option("--json", "print JSON result")
    .action((sessionId: string, opts: SessionCommandOptions) => {
      runCommand(() => sessionsShowCommand(sessionId, opts));
    });

  sessionsCmd
    .command("handoffs")
    .description("List handoff edges across sessions")
    .option("--dir <path>", "trace directory")
    .option("--session <id>", "limit to one session")
    .option("--correlate-group", "include synthetic group: sessions")
    .option("--json", "print JSON result")
    .action((opts: SessionsCommandOptions) => {
      runCommand(() => sessionsHandoffsCommand(opts));
    });

  sessionsCmd
    .command("errors")
    .description("List sessions with errors in a time window")
    .option("--dir <path>", "trace directory")
    .option("--since <duration>", "filter by last activity (default: all)")
    .option("--correlate-group", "include synthetic group: sessions")
    .option("--stale-after <duration>", "staleness threshold for status derivation")
    .option("--json", "print JSON result")
    .action((opts: SessionsCommandOptions) => {
      runCommand(() => sessionsErrorsCommand(opts));
    });

  program
    .command("session")
    .description("Inspect one workflow session: runs, handoffs, retries (read-only)")
    .argument("<session-id>", "session id (from sessions output)")
    .option("--dir <path>", "trace directory")
    .option("--timeline", "include per-run timelines")
    .option("--critical-path", "include critical path section")
    .option("--diagnostics", "include ambiguity warnings")
    .option("--json", "print session view as JSON")
    .action((sessionId: string, opts: SessionCommandOptions) => {
      runCommand(() => sessionCommand(sessionId, opts));
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
      new Option("--section <section>", "report section (default: all)").choices([
        "all",
        "observations",
        "what",
        "timeline",
        "tree",
      ]),
    )
    .addOption(
      new Option(
        "--redaction-profile <profile>",
        "redaction profile for entire report: local, share, strict (default: local)",
      ).choices(["local", "share", "strict"]),
    )
    .action((runId: string, opts: ReportCommandOptions) => {
      runCommand(() => reportCommand(runId, opts));
    });

  program
    .command("redact")
    .description("Redact a local JSON or JSONL trace/file")
    .argument("<trace-or-file>", "trace file, JSON file, stdin -, or run id")
    .option("--dir <path>", "trace directory for run-id lookup")
    .addOption(
      new Option(
        "--profile <profile>",
        "redaction profile: local, share, strict (default: share)",
      ).choices(["local", "share", "strict"]),
    )
    .option("-o, --output <path>", "write redacted content to a file")
    .option("--json", "print deterministic JSON wrapper with findings")
    .action((target: string, opts: RedactCommandOptions) => {
      runCommand(() => redactCommand(target, opts));
    });

  program
    .command("explain")
    .description("Explain a local trace with deterministic facts (no provider calls)")
    .argument("<trace-path-or-run-id>", "trace file, directory, stdin -, or run id")
    .option("--dir <path>", "trace directory for run-id lookup")
    .addOption(
      new Option("--format <format>", "trace input format").choices([
        "agent-inspect-jsonl",
        "openinference-json",
        "otlp-json",
      ]),
    )
    .option("--run <run-id>", "select a run when the trace contains multiple runs")
    .option("--dry-run", "emit only the local facts payload that a provider could receive")
    .option(
      "--provider <provider>",
      "reserved for explicit provider explain; currently rejected without network calls",
    )
    .option("--json", "print deterministic JSON explanation result")
    .addOption(
      new Option(
        "--redaction-profile <profile>",
        "redaction profile for explanation payload: local, share, strict (default: local)",
      ).choices(["local", "share", "strict"]),
    )
    .action((target: string, opts: ExplainCommandOptions) => {
      runCommand(() => explainCommand(target, opts));
    });

  program
    .command("init")
    .description("Initialize a minimal local AgentInspect setup (no dependency install)")
    .addOption(
      new Option("--framework <framework>", "starter framework path").choices([
        "ai-sdk",
        "openai-agents",
        "langchain",
        "custom",
      ]),
    )
    .addOption(new Option("--ci <provider>", "optional CI snippet").choices(["github"]))
    .option("--dry-run", "print planned files without writing")
    .option("--yes", "non-interactive; skip existing files")
    .option("--json", "print deterministic JSON plan/result")
    .action((opts: InitCommandOptions) => {
      runCommand(() => initCommand(opts));
    });

  program
    .command("doctor")
    .description("Diagnose local AgentInspect setup (no network, no installs)")
    .option("--json", "print deterministic JSON results")
    .option("--trace-dir <path>", "trace directory to validate (default .agent-inspect)")
    .option("--check-imports", "check local package resolution", true)
    .option("--no-check-imports", "skip import resolution checks")
    .addOption(
      new Option("--framework <framework>", "check optional adapter packages").choices([
        "ai-sdk",
        "openai-agents",
        "langchain",
        "custom",
      ]),
    )
    .action((opts: DoctorCommandOptions) => {
      runCommand(() => doctorCommand(opts));
    });

  const indexCmd = program
    .command("index")
    .description("Optional local trace directory index (rebuildable metadata cache)");

  indexCmd
    .command("build")
    .description("Build or refresh .agent-inspect-index.json")
    .option("--dir <path>", "trace directory")
    .option("--json", "print JSON result")
    .option("--max-entries <n>", "cap indexed entries (default 10000)")
    .action((opts: IndexCommandOptions) => {
      runCommand(() => indexBuildCommand(opts));
    });

  indexCmd
    .command("status")
    .description("Show index freshness and entry count")
    .option("--dir <path>", "trace directory")
    .option("--json", "print JSON result")
    .action((opts: IndexCommandOptions) => {
      runCommand(() => indexStatusCommand(opts));
    });

  indexCmd
    .command("clean")
    .description("Remove the local index file")
    .option("--dir <path>", "trace directory")
    .option("--json", "print JSON result")
    .action((opts: IndexCommandOptions) => {
      runCommand(() => indexCleanCommand(opts));
    });

  const sqliteCmd = indexCmd
    .command("sqlite")
    .description(
      "Optional SQLite-backed trace index (requires @agent-inspect/index-sqlite)",
    );

  sqliteCmd
    .command("build")
    .description("Build or rebuild the local SQLite index")
    .option("--dir <path>", "trace directory")
    .option("--max-runs <n>", "cap indexed trace files (default 10000)")
    .option("--json", "print JSON result")
    .action((opts: IndexSqliteCommandOptions) => {
      runCommand(() => indexSqliteBuildCommand(opts));
    });

  sqliteCmd
    .command("rebuild")
    .description("Alias for build (full, idempotent rebuild)")
    .option("--dir <path>", "trace directory")
    .option("--max-runs <n>", "cap indexed trace files (default 10000)")
    .option("--json", "print JSON result")
    .action((opts: IndexSqliteCommandOptions) => {
      runCommand(() => indexSqliteBuildCommand(opts));
    });

  sqliteCmd
    .command("status")
    .description("Show SQLite index health, counts, and staleness")
    .option("--dir <path>", "trace directory")
    .option("--json", "print JSON result")
    .action((opts: IndexSqliteCommandOptions) => {
      runCommand(() => indexSqliteStatusCommand(opts));
    });

  sqliteCmd
    .command("query")
    .description("Query indexed runs (fast; falls back with a hint if absent)")
    .option("--dir <path>", "trace directory")
    .addOption(
      new Option("--status <status>", "filter by run status").choices([
        "success",
        "error",
        "running",
        "unknown",
      ]),
    )
    .option("--session <id>", "filter by session id")
    .option("--name <query>", "substring match on run name")
    .option("--kind <kind>", "match runs containing a step of this kind")
    .option("--tool <query>", "match runs containing a tool step (substring)")
    .option("--limit <n>", "max results (default 100)")
    .option("--json", "print JSON result")
    .action((opts: IndexSqliteCommandOptions) => {
      runCommand(() => indexSqliteQueryCommand(opts));
    });

  sqliteCmd
    .command("clean")
    .description("Remove the SQLite index (traces are never touched)")
    .option("--dir <path>", "trace directory")
    .option("--json", "print JSON result")
    .action((opts: IndexSqliteCommandOptions) => {
      runCommand(() => indexSqliteCleanCommand(opts));
    });

  const workspaceCmd = program
    .command("workspace")
    .description("Manage a project-local AgentInspect workspace (.agent-inspect)");

  workspaceCmd
    .command("init")
    .description("Create or adopt a local workspace (never deletes traces)")
    .option("--project <name>", "project name (default: directory name)")
    .addOption(
      new Option("--redaction-profile <profile>", "default redaction posture").choices([
        "local",
        "share",
        "strict",
      ]),
    )
    .option("--dry-run", "print planned changes without writing")
    .option("--json", "print deterministic JSON result")
    .action((opts: WorkspaceInitOptions) => {
      runCommand(() => workspaceInitCommand(opts));
    });

  workspaceCmd
    .command("status")
    .description("Show workspace counts and index status (read-only)")
    .option("--json", "print deterministic JSON result")
    .action((opts: WorkspaceCommandOptions) => {
      runCommand(() => workspaceStatusCommand(opts));
    });

  workspaceCmd
    .command("doctor")
    .description("Validate workspace config, permissions, and index freshness")
    .option("--json", "print deterministic JSON result")
    .action((opts: WorkspaceCommandOptions) => {
      runCommand(() => workspaceDoctorCommand(opts));
    });

  workspaceCmd
    .command("clean")
    .description("Remove generated content (reports/artifacts/bundles/index); traces are never deleted")
    .option("--yes", "actually delete (default is a dry-run)")
    .option("--json", "print deterministic JSON result")
    .action((opts: WorkspaceCleanOptions) => {
      runCommand(() => workspaceCleanCommand(opts));
    });

  workspaceCmd
    .command("path")
    .description("Print resolved workspace paths")
    .option("--json", "print deterministic JSON result")
    .action((opts: WorkspaceCommandOptions) => {
      runCommand(() => workspacePathCommand(opts));
    });

  const suiteCmd = program
    .command("suite")
    .description("Define and run local trace suites for CI (v5.0+)");

  suiteCmd
    .command("init")
    .description("Create a starter agent-inspect.suite.json")
    .option("--template <name>", "PM/QA template id (v5.4+)")
    .option("--dry-run", "show planned files without writing")
    .option("--json", "print deterministic JSON result")
    .action((opts: SuiteCommandOptions) => {
      runCommand(() => suiteInitCommand(opts));
    });

  suiteCmd
    .command("validate")
    .description("Validate suite config shape and trace paths")
    .option("--config <path>", "suite config path")
    .option("--json", "print deterministic JSON result")
    .action((opts: SuiteCommandOptions) => {
      runCommand(() => suiteValidateCommand(opts));
    });

  suiteCmd
    .command("list")
    .description("List suite cases from config")
    .option("--config <path>", "suite config path")
    .option("--json", "print deterministic JSON result")
    .action((opts: SuiteCommandOptions) => {
      runCommand(() => suiteListCommand(opts));
    });

  suiteCmd
    .command("run")
    .description("Run suite checks against configured traces")
    .option("--config <path>", "suite config path")
    .option("-o, --output <dir>", "artifact output directory")
    .option("--json", "print deterministic JSON result")
    .option("--markdown", "print Markdown summary")
    .action((opts: SuiteCommandOptions) => {
      runCommand(() => suiteRunCommand(opts));
    });

  suiteCmd
    .command("report")
    .description("Render a report from a prior suite run artifact")
    .option("--input <path>", "suite run JSON artifact")
    .option("--format <format>", "markdown or json", "markdown")
    .option("--json", "print JSON wrapper")
    .action((opts: SuiteReportCommandOptions) => {
      runCommand(() => suiteReportCommand(opts));
    });

  program
    .command("cohort")
    .description("Compare baseline/candidate trace cohorts for regressions (v5.1+)")
    .option("--dir <path>", "trace directory")
    .option("--baseline <label>", "baseline cohort label (metadata key)")
    .option("--candidate <label>", "candidate cohort label (metadata key)")
    .option("--cohort-key <key>", "metadata key for cohort labels", "cohort")
    .option("--group-by <spec>", "model | session | group | metadata.<key>", "model")
    .option(
      "--metric <list>",
      "comma-separated metrics (errorRate,duration,toolChoice,...)",
    )
    .option("--format <format>", "markdown, json, or html", "markdown")
    .option("-o, --output <dir>", "write cohort-results.json, cohort-summary.md, cohort-report.html")
    .option("--json", "print deterministic JSON result")
    .action((opts: CohortCommandOptions) => {
      runCommand(() => cohortCommand(opts));
    });

  program
    .command("gate")
    .description("Run deterministic CI quality gates over traces or suites (v5.2+)")
    .option("--dir <path>", "trace directory for threshold checks")
    .option("--suite <path>", "suite config path")
    .option("--max-error-rate <percent>", "maximum allowed error rate percentage")
    .option("--max-p95-duration <ms>", "maximum allowed p95 run duration in ms")
    .option("--forbid-tool <name>", "forbidden tool name (repeatable or comma-separated)")
    .option(
      "--require-observation <name>",
      "required passed observation (repeatable or comma-separated)",
    )
    .option("--format <format>", "markdown, json, html, junit, or github", "markdown")
    .option(
      "-o, --output <dir>",
      "write gate-results.json, gate-summary.md, gate-report.html, junit.xml, github-step-summary.md",
    )
    .option("--json", "print deterministic JSON result")
    .action((opts: GateCommandOptions) => {
      runCommand(() => gateCommand(opts));
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
