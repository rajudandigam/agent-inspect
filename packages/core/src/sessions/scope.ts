import type { TraceMetadata } from "../types.js";
import { buildSessionIndex } from "./index.js";
import { extractSessionWorkflowMetadata } from "./metadata.js";
import type { SessionRunRecord, SessionWarning } from "./types.js";

export interface SessionScopeOptions {
  sessionId?: string;
  groupId?: string;
  correlateByGroupId?: boolean;
}

export interface SessionScopeResult {
  metas: TraceMetadata[];
  scopeLabel: string;
  scopeKind: "session" | "group";
  runIds: string[];
  warnings: SessionWarning[];
  notFound: boolean;
}

function metaToSessionRunRecord(meta: TraceMetadata): SessionRunRecord {
  return {
    runId: meta.runId,
    name: meta.name,
    status: meta.status,
    startedAt: meta.startedAt,
    endedAt: meta.endedAt,
    durationMs: meta.durationMs,
    filePath: meta.filePath,
    metadata: undefined,
  };
}

/** Filters trace metadata rows to runs in a session or group scope. */
export function filterMetasBySessionScope(
  metas: readonly TraceMetadata[],
  records: readonly SessionRunRecord[],
  options: SessionScopeOptions,
): SessionScopeResult {
  const sessionId = options.sessionId?.trim();
  const groupId = options.groupId?.trim();
  const warnings: SessionWarning[] = [];

  if (sessionId) {
    const index = buildSessionIndex(records, {
      correlateByGroupId: options.correlateByGroupId === true,
    });
    warnings.push(...index.warnings);
    const session = index.sessions.find((item) => item.sessionId === sessionId);
    if (!session) {
      return {
        metas: [],
        scopeLabel: sessionId,
        scopeKind: "session",
        runIds: [],
        warnings,
        notFound: true,
      };
    }
    const runIdSet = new Set(session.runIds);
    const filtered = metas.filter((meta) => runIdSet.has(meta.runId));
    return {
      metas: filtered,
      scopeLabel: sessionId,
      scopeKind: "session",
      runIds: session.runIds,
      warnings,
      notFound: false,
    };
  }

  if (groupId) {
    const runIds = records
      .filter((run) => extractSessionWorkflowMetadata(run.metadata)?.groupId === groupId)
      .map((run) => run.runId)
      .sort();
    if (runIds.length === 0) {
      return {
        metas: [],
        scopeLabel: groupId,
        scopeKind: "group",
        runIds: [],
        warnings,
        notFound: true,
      };
    }
    const runIdSet = new Set(runIds);
    return {
      metas: metas.filter((meta) => runIdSet.has(meta.runId)),
      scopeLabel: groupId,
      scopeKind: "group",
      runIds,
      warnings,
      notFound: false,
    };
  }

  return {
    metas: [...metas],
    scopeLabel: "",
    scopeKind: "session",
    runIds: [],
    warnings,
    notFound: false,
  };
}

/** Lightweight metadata rows for scope resolution when run_started metadata is absent. */
export function traceMetasToSessionRunRecords(
  metas: readonly TraceMetadata[],
): SessionRunRecord[] {
  return metas.map(metaToSessionRunRecord);
}
