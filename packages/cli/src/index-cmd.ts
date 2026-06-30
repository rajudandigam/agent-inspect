import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { createTraceDirectoryIndexer, indexIsStale } from "@agent-inspect/adapter-sdk";
import type { TraceIndexSnapshot } from "@agent-inspect/adapter-sdk";
import { resolveTraceDir } from "@agent-inspect/core/advanced";

const INDEX_FILENAME = ".agent-inspect-index.json";

export function traceIndexPath(traceDir: string): string {
  return path.join(traceDir, INDEX_FILENAME);
}

export interface IndexCommandOptions {
  dir?: string;
  json?: boolean;
  maxEntries?: string;
}

function parseMaxEntries(raw?: string): number | undefined {
  if (raw === undefined || raw.trim() === "") return undefined;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("--max-entries must be a positive integer.");
  }
  return parsed;
}

async function readSnapshot(indexPath: string): Promise<TraceIndexSnapshot | undefined> {
  try {
    const raw = await readFile(indexPath, "utf8");
    return JSON.parse(raw) as TraceIndexSnapshot;
  } catch {
    return undefined;
  }
}

export async function indexBuildCommand(options: IndexCommandOptions = {}): Promise<void> {
  try {
    const traceDir = resolveTraceDir({ dir: options.dir });
    await mkdir(traceDir, { recursive: true });
    const indexer = createTraceDirectoryIndexer();
    const snapshot = await indexer.rebuild(traceDir, {
      maxEntries: parseMaxEntries(options.maxEntries),
    });
    const indexPath = traceIndexPath(traceDir);
    await writeFile(indexPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");

    if (options.json) {
      console.log(JSON.stringify({ ok: true, indexPath, ...snapshot }, null, 2));
      return;
    }

    console.log(`Built trace index: ${indexPath}`);
    console.log(`Entries: ${snapshot.entries.length}`);
    if (snapshot.warnings.length > 0) {
      for (const warning of snapshot.warnings) {
        console.log(`warning: ${warning}`);
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[AgentInspect] index build failed: ${msg}`);
    process.exitCode = 1;
  }
}

export async function indexStatusCommand(options: IndexCommandOptions = {}): Promise<void> {
  try {
    const traceDir = resolveTraceDir({ dir: options.dir });
    const indexPath = traceIndexPath(traceDir);
    const snapshot = await readSnapshot(indexPath);
    if (!snapshot) {
      const payload = { ok: true, exists: false, indexPath, traceDir, stale: true };
      if (options.json) {
        console.log(JSON.stringify(payload, null, 2));
      } else {
        console.log(`No index at ${indexPath}`);
        console.log("Run: agent-inspect index build");
      }
      return;
    }

    const stale = await indexIsStale(snapshot, traceDir);
    const payload = {
      ok: true,
      exists: true,
      indexPath,
      traceDir,
      stale,
      builtAt: snapshot.builtAt,
      entries: snapshot.entries.length,
      warnings: snapshot.warnings,
    };

    if (options.json) {
      console.log(JSON.stringify(payload, null, 2));
      return;
    }

    console.log(`Index: ${indexPath}`);
    console.log(`Built: ${snapshot.builtAt}`);
    console.log(`Entries: ${snapshot.entries.length}`);
    console.log(`Stale: ${stale ? "yes" : "no"}`);
    if (snapshot.warnings.length > 0) {
      for (const warning of snapshot.warnings) {
        console.log(`warning: ${warning}`);
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[AgentInspect] index status failed: ${msg}`);
    process.exitCode = 1;
  }
}

export async function indexCleanCommand(options: IndexCommandOptions = {}): Promise<void> {
  try {
    const traceDir = resolveTraceDir({ dir: options.dir });
    const indexPath = traceIndexPath(traceDir);
    await rm(indexPath, { force: true });
    if (options.json) {
      console.log(JSON.stringify({ ok: true, removed: indexPath }, null, 2));
      return;
    }
    console.log(`Removed index: ${indexPath}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[AgentInspect] index clean failed: ${msg}`);
    process.exitCode = 1;
  }
}
