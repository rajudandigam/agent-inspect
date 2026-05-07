import { unlink } from "node:fs/promises";
import { stdin as input, stdout as output } from "node:process";

import {
  TraceDirectory,
  extractMetadata,
  isAgentInspectTrace,
  parseDuration,
  resolveTraceDir,
} from "@agent-inspect/core";
import type { TraceMetadata } from "@agent-inspect/core";

export interface CleanOptions {
  dir?: string;
  olderThan?: string;
  keep?: string;
  dryRun?: boolean;
  yes?: boolean;
}

function parseKeep(raw?: string): number {
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  if (trimmed === "") {
    throw new Error(`Invalid --keep value: ${raw}. Provide a positive integer.`);
  }
  const n = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`Invalid --keep value: ${raw}. Provide a positive integer.`);
  }
  return n;
}

function basisTimeMs(meta: TraceMetadata): number {
  const started = typeof meta.startedAt === "number" ? meta.startedAt : undefined;
  const t = started ?? meta.createdAt.getTime();
  return Number.isFinite(t) ? t : 0;
}

function stableSortNewestFirst(a: TraceMetadata, b: TraceMetadata): number {
  const dt = basisTimeMs(b) - basisTimeMs(a);
  if (dt !== 0) return dt;
  return a.runId.localeCompare(b.runId);
}

async function confirmDeletion(count: number): Promise<boolean> {
  const { createInterface } = await import("node:readline/promises");
  const rl = createInterface({ input, output });
  try {
    const answer = await rl.question(
      `Delete ${count} AgentInspect trace file(s)? Type "yes" to continue: `,
    );
    return answer.trim() === "yes";
  } finally {
    rl.close();
  }
}

export async function clean(options: CleanOptions = {}): Promise<void> {
  try {
    const hasOlder = typeof options.olderThan === "string" && options.olderThan.trim() !== "";
    const hasKeep = typeof options.keep === "string" && options.keep.trim() !== "";

    if (!hasOlder && !hasKeep) {
      console.error('clean requires either --older-than <duration> or --keep <count>');
      process.exitCode = 1;
      return;
    }
    if (hasOlder && hasKeep) {
      console.error("Use either --older-than or --keep (not both).");
      process.exitCode = 1;
      return;
    }

    // Validate inputs early (even when trace dir is empty).
    if (hasOlder) {
      parseDuration(options.olderThan!.trim());
    }
    if (hasKeep) {
      parseKeep(options.keep);
    }

    const traceDir = resolveTraceDir({ dir: options.dir });
    const td = new TraceDirectory({ dir: traceDir });
    const files = await td.list();
    if (files.length === 0) {
      console.log("No runs to clean.");
      console.log(`Trace directory: ${traceDir}`);
      return;
    }

    const verified: TraceMetadata[] = [];
    const skipped: string[] = [];

    for (const fileName of files) {
      const filePath = td.getPath(fileName);
      const ok = await isAgentInspectTrace(filePath);
      if (!ok) {
        skipped.push(fileName);
        continue;
      }
      try {
        verified.push(await extractMetadata(filePath));
      } catch {
        // If we cannot extract metadata, do not delete (safety).
        skipped.push(fileName);
      }
    }

    if (verified.length === 0) {
      console.log("No runs to clean.");
      console.log(`Trace directory: ${traceDir}`);
      if (skipped.length > 0) {
        console.log("");
        console.log(`Skipped ${skipped.length} non-AgentInspect file(s).`);
      }
      return;
    }

    let toDelete: TraceMetadata[] = [];

    if (hasOlder) {
      const windowMs = parseDuration(options.olderThan!.trim());
      const cutoff = Date.now() - windowMs;
      toDelete = verified.filter((m) => basisTimeMs(m) < cutoff).sort(stableSortNewestFirst);
    } else {
      const keepN = parseKeep(options.keep);
      const sorted = [...verified].sort(stableSortNewestFirst);
      toDelete = sorted.slice(keepN);
    }

    if (toDelete.length === 0) {
      console.log("No runs to clean.");
      console.log(`Trace directory: ${traceDir}`);
      if (skipped.length > 0) {
        console.log("");
        console.log(`Skipped ${skipped.length} non-AgentInspect file(s).`);
      }
      return;
    }

    if (options.dryRun) {
      console.log(`Would delete ${toDelete.length} run(s):`);
      for (const m of toDelete) {
        console.log(`- ${m.filePath}`);
      }
      if (skipped.length > 0) {
        console.log("");
        console.log(`Skipped ${skipped.length} non-AgentInspect file(s).`);
      }
      return;
    }

    if (options.yes !== true) {
      if (input.isTTY !== true) {
        console.error(
          "Refusing to delete without --yes in a non-interactive terminal.",
        );
        process.exitCode = 1;
        return;
      }
      const ok = await confirmDeletion(toDelete.length);
      if (!ok) {
        console.log("Cancelled.");
        return;
      }
    }

    let deleted = 0;
    for (const m of toDelete) {
      const ok = await isAgentInspectTrace(m.filePath);
      if (!ok) {
        skipped.push(m.filePath);
        continue;
      }
      try {
        await unlink(m.filePath);
        deleted += 1;
      } catch {
        // ignore per-file failure; keep deterministic count
      }
    }

    console.log(`Deleted ${deleted} run(s).`);
    console.log(`Trace directory: ${traceDir}`);
    if (skipped.length > 0) {
      console.log("");
      console.log(`Skipped ${skipped.length} non-AgentInspect file(s).`);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[AgentInspect] clean failed: ${msg}`);
    process.exitCode = 1;
  }
}

