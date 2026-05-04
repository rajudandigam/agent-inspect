#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Command, Option } from "commander";

import type { ListOptions } from "./list.js";
import { list } from "./list.js";
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
      ]),
    )
    .action(
      (opts: {
        dir?: string;
        limit?: string;
        status?: ListOptions["status"];
      }) => {
        runCommand(() => list(opts));
      },
    );

  program
    .command("view")
    .description("View a single run trace")
    .argument("<run-id>", "run id (e.g. from list output)")
    .option("--dir <path>", "trace directory")
    .option("--verbose", "show extra detail (types, metadata, error stacks)")
    .option("--json", "print raw trace events as JSON")
    .action(
      (
        runId: string,
        opts: { dir?: string; verbose?: boolean; json?: boolean },
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
  return path.resolve(entry) === path.resolve(selfPath);
}

if (isPrimaryModule()) {
  createCliProgram().parse(process.argv);
}
