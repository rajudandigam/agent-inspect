import type { TraceDirectory } from "@agent-inspect/core/advanced";

/** Documented in docs/SCALE-LIMITS.md — warn before expensive directory scans. */
export const TRACE_COUNT_WARN = 1_000;
export const TRACE_COUNT_SEVERE = 10_000;
export const LARGE_TRACE_FILE_BYTES = 50 * 1024 * 1024;

export interface TraceDirScaleAssessment {
  traceCount: number;
  largeFileCount: number;
  warnings: string[];
}

export function buildScaleWarnings(traceCount: number, largeFileCount: number): string[] {
  const warnings: string[] = [];
  if (traceCount >= TRACE_COUNT_SEVERE) {
    warnings.push(
      `trace directory has ${traceCount} runs (>= ${TRACE_COUNT_SEVERE}); archive or split traces — see docs/SCALE-LIMITS.md`,
    );
  } else if (traceCount >= TRACE_COUNT_WARN) {
    warnings.push(
      `trace directory has ${traceCount} runs (>= ${TRACE_COUNT_WARN}); list/search/stats may be slow — consider agent-inspect index build`,
    );
  }
  if (largeFileCount > 0) {
    warnings.push(
      `${largeFileCount} trace file(s) exceed ${Math.round(LARGE_TRACE_FILE_BYTES / (1024 * 1024))}MB; open/check/report may be slow`,
    );
  }
  return warnings;
}

export async function assessTraceDirectoryScale(
  td: TraceDirectory,
  options: { sampleLargeFiles?: number } = {},
): Promise<TraceDirScaleAssessment> {
  const files = await td.list();
  const sample = options.sampleLargeFiles ?? 25;
  let largeFileCount = 0;

  if (files.length > 0 && files.length <= sample * 4) {
    for (const file of files) {
      try {
        const stats = await td.getFileStats(file);
        if (stats.size >= LARGE_TRACE_FILE_BYTES) largeFileCount += 1;
      } catch {
        /* skip */
      }
    }
  } else if (files.length > sample) {
    for (const file of files.slice(0, sample)) {
      try {
        const stats = await td.getFileStats(file);
        if (stats.size >= LARGE_TRACE_FILE_BYTES) largeFileCount += 1;
      } catch {
        /* skip */
      }
    }
    if (largeFileCount > 0) {
      largeFileCount = Math.max(largeFileCount, 1);
    }
  }

  const warnings = buildScaleWarnings(files.length, largeFileCount);
  return { traceCount: files.length, largeFileCount, warnings };
}

export function emitScaleWarnings(
  assessment: TraceDirScaleAssessment,
  options: { json?: boolean } = {},
): void {
  if (options.json || assessment.warnings.length === 0) return;
  for (const warning of assessment.warnings) {
    console.error(`[AgentInspect] warning: ${warning}`);
  }
}
