import { readdir, stat } from "node:fs/promises";
import path from "node:path";

import { resolveTraceDir } from "@agent-inspect/core/advanced";
import type * as IndexSqlite from "@agent-inspect/index-sqlite";

const PACKAGE = "@agent-inspect/index-sqlite";

export interface IndexSqliteCommandOptions {
  dir?: string;
  json?: boolean;
  maxRuns?: string;
  status?: string;
  session?: string;
  name?: string;
  kind?: string;
  tool?: string;
  limit?: string;
}

function isModuleNotFound(e: unknown): boolean {
  return (
    e !== null &&
    typeof e === "object" &&
    "code" in e &&
    ((e as NodeJS.ErrnoException).code === "ERR_MODULE_NOT_FOUND" ||
      (e as NodeJS.ErrnoException).code === "MODULE_NOT_FOUND")
  );
}

async function loadIndexSqlite(): Promise<typeof IndexSqlite | null> {
  try {
    return (await import("@agent-inspect/index-sqlite")) as typeof IndexSqlite;
  } catch (e) {
    if (isModuleNotFound(e)) {
      console.error(
        `The optional SQLite index is not installed. Run: npm install ${PACKAGE}`,
      );
      process.exitCode = 1;
      return null;
    }
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[AgentInspect] failed to load ${PACKAGE}: ${msg}`);
    process.exitCode = 1;
    return null;
  }
}

function parsePositiveInt(raw: string | undefined, flag: string): number | undefined {
  if (raw === undefined || raw.trim() === "") return undefined;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${flag} must be a positive integer.`);
  }
  return parsed;
}

async function newestTraceMtimeMs(traceDir: string): Promise<number> {
  let newest = 0;
  try {
    const files = await readdir(traceDir);
    for (const file of files) {
      if (!file.endsWith(".jsonl")) continue;
      try {
        const s = await stat(path.join(traceDir, file));
        if (s.mtimeMs > newest) newest = s.mtimeMs;
      } catch {
        // ignore unreadable entries
      }
    }
  } catch {
    // missing directory -> newest stays 0
  }
  return newest;
}

export async function indexSqliteBuildCommand(
  options: IndexSqliteCommandOptions = {},
): Promise<void> {
  const mod = await loadIndexSqlite();
  if (!mod) return;
  const result = await mod.buildIndex({
    traceDir: options.dir,
    maxRuns: parsePositiveInt(options.maxRuns, "--max-runs"),
  });
  if (options.json) {
    console.log(JSON.stringify({ ok: true, ...result }, null, 2));
    return;
  }
  console.log(`Built SQLite index: ${result.dbPath}`);
  console.log(`Runs: ${result.runs}  Steps: ${result.steps}  Errors: ${result.errors}`);
  for (const warning of result.warnings) console.log(`warning: ${warning}`);
}

export async function indexSqliteStatusCommand(
  options: IndexSqliteCommandOptions = {},
): Promise<void> {
  const mod = await loadIndexSqlite();
  if (!mod) return;
  const traceDir = resolveTraceDir({ dir: options.dir });
  const dbPath = mod.resolveIndexDbPath(traceDir);
  const status = mod.indexStatus(dbPath);
  const stale = mod.isIndexStale(dbPath, await newestTraceMtimeMs(traceDir));
  if (options.json) {
    console.log(JSON.stringify({ ok: true, traceDir, stale, ...status }, null, 2));
    return;
  }
  if (!status.exists) {
    console.log(`No SQLite index at ${dbPath}`);
    console.log("Run: agent-inspect index sqlite build");
    return;
  }
  console.log(`Index: ${status.dbPath}`);
  console.log(`Healthy: ${status.healthy ? "yes" : "no"}`);
  console.log(`Built: ${status.builtAt ?? "unknown"}`);
  console.log(`Runs: ${status.runs}  Steps: ${status.steps}`);
  console.log(`Stale: ${stale ? "yes" : "no"}`);
}

export async function indexSqliteQueryCommand(
  options: IndexSqliteCommandOptions = {},
): Promise<void> {
  const mod = await loadIndexSqlite();
  if (!mod) return;
  const traceDir = resolveTraceDir({ dir: options.dir });
  const dbPath = mod.resolveIndexDbPath(traceDir);
  const status = mod.indexStatus(dbPath);
  if (!status.exists || !status.healthy) {
    if (options.json) {
      console.log(JSON.stringify({ ok: false, reason: "index-missing", dbPath }, null, 2));
    } else {
      console.log("No usable SQLite index. Run: agent-inspect index sqlite build");
    }
    process.exitCode = 1;
    return;
  }
  const rows = mod.queryRuns(dbPath, {
    status: options.status,
    sessionId: options.session,
    name: options.name,
    kind: options.kind,
    tool: options.tool,
    limit: parsePositiveInt(options.limit, "--limit"),
  });
  if (options.json) {
    console.log(JSON.stringify({ ok: true, count: rows.length, runs: rows }, null, 2));
    return;
  }
  if (rows.length === 0) {
    console.log("No matching runs.");
    return;
  }
  for (const run of rows) {
    const parts = [
      run.runId,
      run.status ?? "unknown",
      run.name ?? "",
      run.durationMs != null ? `${run.durationMs}ms` : "",
    ].filter((p) => p !== "");
    console.log(parts.join("  "));
  }
}

export async function indexSqliteCleanCommand(
  options: IndexSqliteCommandOptions = {},
): Promise<void> {
  const mod = await loadIndexSqlite();
  if (!mod) return;
  const traceDir = resolveTraceDir({ dir: options.dir });
  const dbPath = mod.resolveIndexDbPath(traceDir);
  await mod.cleanIndex(dbPath);
  if (options.json) {
    console.log(JSON.stringify({ ok: true, removed: dbPath }, null, 2));
    return;
  }
  console.log(`Removed SQLite index: ${dbPath}`);
}
