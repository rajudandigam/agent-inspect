import type {
  ActivityEntry,
  ActivitySummary,
  BuildActivitySummaryOptions,
  SessionIndex,
  SessionStatus,
  SessionSummary,
} from "./types.js";

function statusLine(session: SessionSummary): string {
  const name =
    session.workflowId ??
    session.correlationId ??
    session.sessionId;
  const status = session.status;
  if (session.lastError) {
    return `${name} session ${session.sessionId} failed at ${session.lastError.message}`;
  }
  if (session.observationSummary) {
    return `${name} session ${session.sessionId} ${status} with observation warning`;
  }
  return `${name} session ${session.sessionId} ${status}`;
}

function parseSinceMs(since: string | undefined, nowMs: number): number {
  if (!since || since.trim() === "") return nowMs - 7 * 86_400_000;
  const trimmed = since.trim().toLowerCase();
  const match = /^(\d+)([smhd])$/.exec(trimmed);
  if (!match) return nowMs - 7 * 86_400_000;
  const amount = Number.parseInt(match[1]!, 10);
  const unit = match[2];
  const mult =
    unit === "s" ? 1000 : unit === "m" ? 60_000 : unit === "h" ? 3_600_000 : 86_400_000;
  return nowMs - amount * mult;
}

function isFailed(status: SessionStatus): boolean {
  return status === "error";
}

function isStale(status: SessionStatus): boolean {
  return status === "stale";
}

function guardrailWarnings(session: SessionSummary): number {
  const summary = session.checkSummary;
  if (!summary) return 0;
  return summary.warn;
}

/**
 * Builds a deterministic activity summary from a session index (v4.2).
 * Read-only; does not mutate traces or invent relationships.
 */
export function buildActivitySummary(
  index: SessionIndex,
  options: BuildActivitySummaryOptions = {},
): ActivitySummary {
  const nowMs = options.nowMs ?? Date.now();
  const sinceMs = parseSinceMs(options.since, nowMs);
  const sinceIso = new Date(sinceMs).toISOString();
  const limit =
    Number.isInteger(options.limit) && options.limit! > 0 ? options.limit! : 20;

  const inWindow = index.sessions.filter((session) => {
    const activityMs = Date.parse(session.lastActivity);
    return Number.isFinite(activityMs) && activityMs >= sinceMs;
  });

  const entries: ActivityEntry[] = [...inWindow]
    .sort((a, b) => Date.parse(b.lastActivity) - Date.parse(a.lastActivity))
    .slice(0, limit)
    .map((session) => ({
      sessionId: session.sessionId,
      status: session.status,
      summary: statusLine(session),
      lastActivity: session.lastActivity,
      runCount: session.runIds.length,
    }));

  let failed = 0;
  let stale = 0;
  let guardrailWarningTotal = 0;
  for (const session of inWindow) {
    if (isFailed(session.status)) failed += 1;
    if (isStale(session.status)) stale += 1;
    guardrailWarningTotal += guardrailWarnings(session);
  }

  return {
    since: sinceIso,
    sessions: inWindow.length,
    failed,
    stale,
    guardrailWarnings: guardrailWarningTotal,
    entries,
  };
}

/** Renders a human activity summary for terminal output. */
export function renderActivitySummaryHuman(
  summary: ActivitySummary,
  options?: { nowMs?: number },
): string {
  const lines: string[] = [];
  const nowMs = options?.nowMs ?? Date.now();
  const todayStart = new Date(nowMs);
  todayStart.setHours(0, 0, 0, 0);
  const todayMs = todayStart.getTime();

  const today = summary.entries.filter(
    (entry) => Date.parse(entry.lastActivity) >= todayMs,
  );
  if (today.length > 0) {
    lines.push("Today");
    for (const entry of today) {
      lines.push(`  ${entry.summary}`);
    }
    lines.push("");
  }

  lines.push(`Since ${summary.since}`);
  lines.push(`  ${summary.sessions} sessions`);
  lines.push(`  ${summary.failed} failed`);
  lines.push(`  ${summary.stale} stale`);
  lines.push(`  ${summary.guardrailWarnings} guardrail warnings`);

  return lines.join("\n");
}
