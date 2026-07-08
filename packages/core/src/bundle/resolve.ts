import { parseDuration } from "../utils/duration.js";
import type { SessionIndex, SessionRunRecord } from "../sessions/types.js";
import type { BundleResolveOptions, BundleResolveResult } from "./types.js";

function parseSinceCutoff(since: string): number {
  const trimmed = since.trim();
  if (trimmed === "") {
    throw new Error("--since requires a non-empty duration (e.g. 24h, 7d).");
  }
  return Date.now() - parseDuration(trimmed);
}

function runActivityMs(run: SessionRunRecord): number | undefined {
  if (run.startedAt !== undefined && Number.isFinite(run.startedAt)) return run.startedAt;
  if (run.endedAt !== undefined && Number.isFinite(run.endedAt)) return run.endedAt;
  return undefined;
}

function runsInSinceWindow(
  runs: readonly SessionRunRecord[],
  since: string,
): string[] {
  const cutoff = parseSinceCutoff(since);
  const ids: string[] = [];
  for (const run of runs) {
    const activity = runActivityMs(run);
    if (activity !== undefined && activity >= cutoff) {
      ids.push(run.runId);
    }
  }
  return ids.sort((a, b) => a.localeCompare(b));
}

function findSession(index: SessionIndex, sessionId: string) {
  return index.sessions.find((session) => session.sessionId === sessionId);
}

/**
 * Resolves which run ids belong in a bundle.
 *
 * @throws when target mode is missing, ambiguous, or yields zero runs.
 */
export function resolveBundleRunIds(
  index: SessionIndex,
  runs: readonly SessionRunRecord[],
  options: BundleResolveOptions,
): BundleResolveResult {
  const runId = options.runId?.trim();
  const sessionId = options.sessionId?.trim();
  const since = options.since?.trim();

  const modes = [runId ? 1 : 0, sessionId ? 1 : 0, since ? 1 : 0].reduce((a, b) => a + b, 0);
  if (modes === 0) {
    throw new Error(
      "bundle requires a run id, --session <sessionId>, or --since <duration>.",
    );
  }
  if (modes > 1) {
    throw new Error(
      "bundle accepts only one target: a run id, --session, or --since (not combined).",
    );
  }

  if (runId) {
    const known = runs.some((run) => run.runId === runId);
    if (!known) {
      throw new Error(`Run "${runId}" was not found in the trace directory.`);
    }
    return { runIds: [runId] };
  }

  if (sessionId) {
    const session = findSession(index, sessionId);
    if (!session) {
      throw new Error(`Session "${sessionId}" was not found.`);
    }
    if (session.runIds.length === 0) {
      throw new Error(`Session "${sessionId}" has no runs to bundle.`);
    }
    return {
      runIds: [...session.runIds].sort((a, b) => a.localeCompare(b)),
      sessionId,
    };
  }

  const runIds = runsInSinceWindow(runs, since!);
  if (runIds.length === 0) {
    throw new Error(`No runs matched --since ${since}.`);
  }
  return { runIds, since };
}
