import { loadTraceMetadataList, TraceDirectory } from "agent-inspect/advanced";

export interface TraceIndexEntry {
  runId: string;
  path: string;
  name?: string;
  startedAt?: number;
  status?: string;
}

export interface TraceIndexSnapshot {
  traceDir: string;
  builtAt: string;
  entries: TraceIndexEntry[];
  warnings: string[];
}

export interface TraceIndexOptions {
  maxEntries?: number;
  /** Rebuild when snapshot `builtAt` is older than this ISO timestamp. */
  invalidateBefore?: string;
  [key: string]: unknown;
}

export interface TraceIndexer {
  readonly id: string;
  rebuild(traceDir: string, options?: TraceIndexOptions): Promise<TraceIndexSnapshot>;
}

export function defineIndexer(indexer: TraceIndexer): TraceIndexer {
  if (!indexer.id.trim()) throw new Error("indexer id is required");
  return indexer;
}

export function shouldInvalidateIndex(
  snapshot: TraceIndexSnapshot,
  options: TraceIndexOptions = {},
): boolean {
  if (!options.invalidateBefore) return false;
  const cutoff = Date.parse(options.invalidateBefore);
  const builtAt = Date.parse(snapshot.builtAt);
  if (Number.isNaN(cutoff) || Number.isNaN(builtAt)) return true;
  return builtAt < cutoff;
}

export async function indexIsStale(
  snapshot: TraceIndexSnapshot,
  traceDir: string,
): Promise<boolean> {
  const builtMs = Date.parse(snapshot.builtAt);
  if (Number.isNaN(builtMs)) return true;

  const td = new TraceDirectory({ dir: traceDir });
  const files = await td.list();
  for (const file of files) {
    const stats = await td.getFileStats(file);
    if (stats.mtimeMs > builtMs) return true;
  }
  return false;
}

export function createTraceDirectoryIndexer(): TraceIndexer {
  return defineIndexer({
    id: "trace-directory-metadata",
    async rebuild(traceDir, options = {}) {
      const warnings: string[] = [];
      const td = new TraceDirectory({ dir: traceDir });
      const files = await td.list();
      const maxEntries = options.maxEntries ?? 10_000;

      if (files.length > maxEntries) {
        warnings.push(
          `indexer.truncated: trace directory has ${files.length} files; indexing first ${maxEntries}`,
        );
      }

      const slice = files.slice(0, maxEntries);
      const metas = await loadTraceMetadataList(traceDir, slice, (fileName) =>
        td.getPath(fileName),
      );

      const entries: TraceIndexEntry[] = metas
        .map((meta) => ({
          runId: meta.runId,
          path: meta.filePath,
          name: meta.name,
          startedAt: meta.startedAt,
          status: meta.status,
        }))
        .sort((a, b) => a.runId.localeCompare(b.runId));

      if (entries.length < slice.length) {
        warnings.push(
          `indexer.partial: indexed ${entries.length} of ${slice.length} trace files`,
        );
      }

      return {
        traceDir,
        builtAt: new Date().toISOString(),
        entries,
        warnings,
      };
    },
  });
}
