import { access } from "node:fs/promises";
import path from "node:path";

const CANDIDATE_DIRS = [".agent-inspect", ".agent-inspect-runs"] as const;

export interface TraceDirCandidate {
  path: string;
  source: "workspace" | "env" | "default";
}

async function isReadableDir(dirPath: string): Promise<boolean> {
  try {
    await access(dirPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolve trace directories for a workspace folder (read-only, no network).
 */
export async function discoverTraceDirs(
  workspaceRoot: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<TraceDirCandidate[]> {
  const found: TraceDirCandidate[] = [];
  const seen = new Set<string>();

  const envDir = env.AGENT_INSPECT_TRACE_DIR?.trim();
  if (envDir) {
    const resolved = path.resolve(workspaceRoot, envDir);
    if (!seen.has(resolved) && (await isReadableDir(resolved))) {
      seen.add(resolved);
      found.push({ path: resolved, source: "env" });
    }
  }

  for (const name of CANDIDATE_DIRS) {
    const resolved = path.join(workspaceRoot, name);
    if (!seen.has(resolved) && (await isReadableDir(resolved))) {
      seen.add(resolved);
      found.push({ path: resolved, source: "workspace" });
    }
  }

  const defaultDir = path.join(workspaceRoot, ".agent-inspect");
  if (!seen.has(defaultDir)) {
    found.push({ path: defaultDir, source: "default" });
  }

  return found;
}

export function pickPrimaryTraceDir(candidates: TraceDirCandidate[]): string {
  const env = candidates.find((c) => c.source === "env");
  if (env) return env.path;
  const workspace = candidates.find((c) => c.source === "workspace");
  if (workspace) return workspace.path;
  return candidates[0]?.path ?? path.join(process.cwd(), ".agent-inspect");
}

/** Match run IDs and trace directory hints in editor text. */
export function findTraceHints(text: string): { runId?: string; traceDir?: string } {
  const runIdMatch = text.match(/\b(run_[A-Za-z0-9_-]{8,})\b/);
  const dirMatch = text.match(/([^\s'"]*\.agent-inspect(?:-runs)?)/);
  return {
    runId: runIdMatch?.[1],
    traceDir: dirMatch?.[1],
  };
}
