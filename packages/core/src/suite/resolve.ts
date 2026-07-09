import { access } from "node:fs/promises";
import path from "node:path";

import { getTraceFilePath } from "../utils.js";
import type { SuiteCaseConfig } from "./types.js";

export interface ResolvedSuiteCase {
  caseId: string;
  tracePath?: string;
  runId?: string;
  missing: boolean;
  reason?: string;
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function resolveSuiteCaseTrace(
  suiteCase: SuiteCaseConfig,
  options: { configDir: string; tracesDir: string },
): Promise<ResolvedSuiteCase> {
  if (suiteCase.trace !== undefined) {
    const tracePath = path.resolve(options.configDir, suiteCase.trace);
    if (await exists(tracePath)) {
      return { caseId: suiteCase.id, tracePath, missing: false };
    }
    return {
      caseId: suiteCase.id,
      tracePath,
      missing: true,
      reason: `trace file not found: ${suiteCase.trace}`,
    };
  }

  const runKey = suiteCase.runId ?? suiteCase.id;
  const directPath = getTraceFilePath(runKey, options.tracesDir);
  if (await exists(directPath)) {
    return { caseId: suiteCase.id, tracePath: directPath, runId: runKey, missing: false };
  }

  const nestedPath = path.join(options.tracesDir, `${path.basename(runKey)}.jsonl`);
  if (await exists(nestedPath)) {
    return { caseId: suiteCase.id, tracePath: nestedPath, runId: runKey, missing: false };
  }

  return {
    caseId: suiteCase.id,
    runId: runKey,
    missing: true,
    reason: `no trace found for run id "${runKey}" under ${options.tracesDir}`,
  };
}
