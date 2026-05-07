#!/usr/bin/env node
import { realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Command, Option } from "commander";

import type { ListOptions } from "./list.js";
import { list } from "./list.js";
import type { ViewOptions } from "./view.js";
import { view } from "./view.js";

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
    .version("0.1.0");

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
    .action(
      (
        runId: string,
        opts: ViewOptions,
      ) => {
        runCommand(() => view(runId, opts));
      },
    );

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
