import path from "node:path";
import { fileURLToPath } from "node:url";

import { Command } from "commander";

import "@agent-inspect/core";

export function createCliProgram(): Command {
  return new Command("agent-inspect")
    .description("AgentInspect CLI (scaffold only)")
    .version("0.1.0");
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
