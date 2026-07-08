import {
  buildActivitySummary,
  buildRunTimeline,
  buildSessionIndex,
  parseDuration,
  renderActivitySummaryHuman,
  renderTimeline,
  resolveTraceDir,
  type HandoffEdge,
  type SessionIndex,
  type SessionSummary,
} from "@agent-inspect/core/advanced";

import { readRunTraceEvents } from "./read-run.js";
import { loadSessionRuns } from "./sessions-load.js";

export interface SessionsCommandOptions {
  dir?: string;
  json?: boolean;
  correlateGroup?: boolean;
  since?: string;
  staleAfter?: string;
  session?: string;
}

export interface SessionCommandOptions {
  dir?: string;
  json?: boolean;
  timeline?: boolean;
  criticalPath?: boolean;
  diagnostics?: boolean;
}

async function loadSessionIndex(
  traceDir: string,
  options: {
    correlateGroup?: boolean;
    staleAfter?: string;
  } = {},
): Promise<SessionIndex> {
  const { runs } = await loadSessionRuns(traceDir);
  const staleThresholdMs =
    options.staleAfter && options.staleAfter.trim() !== ""
      ? parseDuration(options.staleAfter.trim())
      : undefined;
  return buildSessionIndex(runs, {
    correlateByGroupId: options.correlateGroup === true,
    staleThresholdMs,
  });
}

function findSession(
  index: SessionIndex,
  sessionId: string,
): SessionSummary | undefined {
  return index.sessions.find((session) => session.sessionId === sessionId);
}

function latestSession(index: SessionIndex): SessionSummary | undefined {
  if (index.sessions.length === 0) return undefined;
  return [...index.sessions].sort(
    (a, b) => Date.parse(b.lastActivity) - Date.parse(a.lastActivity),
  )[0];
}

function parseSinceCutoff(since: string | undefined): number | undefined {
  if (!since || since.trim() === "") return undefined;
  return Date.now() - parseDuration(since.trim());
}

function sessionsInSinceWindow(
  index: SessionIndex,
  since?: string,
): SessionSummary[] {
  const cutoff = parseSinceCutoff(since);
  if (cutoff === undefined) return index.sessions;
  return index.sessions.filter(
    (session) => Date.parse(session.lastActivity) >= cutoff,
  );
}

function renderSessionsHuman(index: SessionIndex, traceDir: string): void {
  if (index.sessions.length === 0) {
    console.log("No sessions found");
    console.log(`Trace directory: ${traceDir}`);
    if (index.unscopedRunIds.length > 0) {
      console.log(
        `Unscoped runs (no sessionId): ${index.unscopedRunIds.join(", ")}`,
      );
    }
    return;
  }

  console.log("Sessions:");
  for (const session of index.sessions) {
    const suffix = session.workflowId ? ` workflow=${session.workflowId}` : "";
    console.log(
      `  ${session.sessionId} [${session.status}] (${session.runIds.length} run${session.runIds.length === 1 ? "" : "s"})${suffix}`,
    );
  }

  if (index.unscopedRunIds.length > 0) {
    console.log("");
    console.log(
      `Unscoped runs (no sessionId): ${index.unscopedRunIds.join(", ")}`,
    );
  }
}

function renderSessionHuman(
  session: SessionSummary,
  index: SessionIndex,
  options: SessionCommandOptions,
): void {
  console.log(`Session: ${session.sessionId}`);
  console.log(`Status: ${session.status}`);
  console.log(`Runs: ${session.runIds.join(", ")}`);
  if (session.lastActivity) console.log(`Last activity: ${session.lastActivity}`);
  if (session.lastError) {
    console.log(
      `Last error: ${session.lastError.message} (run ${session.lastError.runId})`,
    );
  }

  if (session.handoffs.length > 0) {
    console.log("");
    console.log("Handoffs:");
    for (const edge of session.handoffs) {
      console.log(
        `  ${edge.from} -> ${edge.to} (${edge.confidence}, ${edge.source})`,
      );
    }
  }

  if (session.retries.length > 0) {
    console.log("");
    console.log("Retries:");
    for (const retry of session.retries) {
      const attempt =
        retry.attempt !== undefined ? ` attempt=${retry.attempt}` : "";
      const of = retry.retryOf !== undefined ? ` retryOf=${retry.retryOf}` : "";
      console.log(
        `  ${retry.runId}${attempt}${of} (${retry.confidence})`,
      );
    }
  }

  if (options.criticalPath && session.criticalPath.length > 0) {
    console.log("");
    console.log("Critical path:");
    for (const step of session.criticalPath) {
      const duration =
        step.durationMs !== undefined ? ` ${step.durationMs}ms` : "";
      console.log(
        `  ${step.runId}${step.name ? ` (${step.name})` : ""}${duration} [${step.confidence}]`,
      );
    }
  }

  if (options.diagnostics && index.warnings.length > 0) {
    const scoped = index.warnings.filter(
      (warning) =>
        warning.sessionId === session.sessionId || !warning.sessionId,
    );
    if (scoped.length > 0) {
      console.log("");
      console.log("Diagnostics:");
      for (const warning of scoped) {
        const run = warning.runId ? ` run=${warning.runId}` : "";
        console.log(`  [${warning.code}]${run} ${warning.message}`);
      }
    }
  }
}

function collectHandoffs(
  index: SessionIndex,
  sessionId?: string,
): Array<HandoffEdge & { sessionId: string }> {
  const sessions = sessionId
    ? index.sessions.filter((s) => s.sessionId === sessionId)
    : index.sessions;
  const out: Array<HandoffEdge & { sessionId: string }> = [];
  for (const session of sessions) {
    for (const edge of session.handoffs) {
      out.push({ ...edge, sessionId: session.sessionId });
    }
  }
  return out.sort((a, b) => {
    const session = a.sessionId.localeCompare(b.sessionId);
    if (session !== 0) return session;
    const from = a.from.localeCompare(b.from);
    if (from !== 0) return from;
    return a.to.localeCompare(b.to);
  });
}

export async function sessionsCommand(
  options: SessionsCommandOptions = {},
): Promise<void> {
  try {
    const traceDir = resolveTraceDir({ dir: options.dir });
    const index = await loadSessionIndex(traceDir, {
      correlateGroup: options.correlateGroup,
      staleAfter: options.staleAfter,
    });

    if (options.json) {
      console.log(
        JSON.stringify(
          {
            traceDir,
            sessions: index.sessions,
            unscopedRunIds: index.unscopedRunIds,
            warnings: index.warnings,
          },
          null,
          2,
        ),
      );
      return;
    }

    renderSessionsHuman(index, traceDir);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[AgentInspect] sessions failed: ${msg}`);
    process.exitCode = 1;
  }
}

export async function sessionsLatestCommand(
  options: SessionsCommandOptions = {},
): Promise<void> {
  try {
    const traceDir = resolveTraceDir({ dir: options.dir });
    const index = await loadSessionIndex(traceDir, {
      correlateGroup: options.correlateGroup,
      staleAfter: options.staleAfter,
    });
    const latest = latestSession(index);
    if (!latest) {
      if (options.json) {
        console.log(JSON.stringify({ ok: false, traceDir, reason: "no-sessions" }, null, 2));
      } else {
        console.log("No sessions found");
        console.log(`Trace directory: ${traceDir}`);
      }
      process.exitCode = 1;
      return;
    }
    if (options.json) {
      console.log(JSON.stringify({ ok: true, traceDir, session: latest }, null, 2));
      return;
    }
    console.log(`Latest session: ${latest.sessionId}`);
    console.log(`Status: ${latest.status}`);
    console.log(`Last activity: ${latest.lastActivity}`);
    console.log(`Runs: ${latest.runIds.join(", ")}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[AgentInspect] sessions latest failed: ${msg}`);
    process.exitCode = 1;
  }
}

export async function sessionsActivityCommand(
  options: SessionsCommandOptions = {},
): Promise<void> {
  try {
    const traceDir = resolveTraceDir({ dir: options.dir });
    const index = await loadSessionIndex(traceDir, {
      correlateGroup: options.correlateGroup,
      staleAfter: options.staleAfter,
    });
    const summary = buildActivitySummary(index, { since: options.since });
    if (options.json) {
      console.log(JSON.stringify({ ok: true, traceDir, ...summary }, null, 2));
      return;
    }
    console.log(renderActivitySummaryHuman(summary));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[AgentInspect] sessions activity failed: ${msg}`);
    process.exitCode = 1;
  }
}

export async function sessionsHandoffsCommand(
  options: SessionsCommandOptions = {},
): Promise<void> {
  try {
    const traceDir = resolveTraceDir({ dir: options.dir });
    const index = await loadSessionIndex(traceDir, {
      correlateGroup: options.correlateGroup,
    });
    const handoffs = collectHandoffs(index, options.session);
    if (options.json) {
      console.log(
        JSON.stringify({ ok: true, traceDir, count: handoffs.length, handoffs }, null, 2),
      );
      return;
    }
    if (handoffs.length === 0) {
      console.log("No handoffs found");
      return;
    }
    for (const edge of handoffs) {
      console.log(
        `${edge.sessionId}: ${edge.from} -> ${edge.to} (${edge.confidence})`,
      );
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[AgentInspect] sessions handoffs failed: ${msg}`);
    process.exitCode = 1;
  }
}

export async function sessionsErrorsCommand(
  options: SessionsCommandOptions = {},
): Promise<void> {
  try {
    const traceDir = resolveTraceDir({ dir: options.dir });
    const index = await loadSessionIndex(traceDir, {
      correlateGroup: options.correlateGroup,
      staleAfter: options.staleAfter,
    });
    const scoped = sessionsInSinceWindow(index, options.since);
    const errors = scoped.filter((session) => session.status === "error");
    if (options.json) {
      console.log(
        JSON.stringify(
          { ok: true, traceDir, count: errors.length, sessions: errors },
          null,
          2,
        ),
      );
      return;
    }
    if (errors.length === 0) {
      console.log("No error sessions found");
      return;
    }
    for (const session of errors) {
      const detail = session.lastError?.message ?? "error";
      console.log(`${session.sessionId}  ${detail}  (${session.runIds.length} runs)`);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[AgentInspect] sessions errors failed: ${msg}`);
    process.exitCode = 1;
  }
}

export async function sessionsShowCommand(
  sessionId: string,
  options: SessionCommandOptions = {},
): Promise<void> {
  await sessionCommand(sessionId, options);
}

export async function sessionCommand(
  sessionId: string,
  options: SessionCommandOptions = {},
): Promise<void> {
  const id =
    typeof sessionId === "string" && sessionId.trim() !== ""
      ? sessionId.trim()
      : "";
  if (id === "") {
    console.error("Session id is required");
    process.exitCode = 1;
    return;
  }

  try {
    const traceDir = resolveTraceDir({ dir: options.dir });
    const index = await loadSessionIndex(traceDir);
    const session = findSession(index, id);

    if (!session) {
      console.log(`Session not found: ${id}`);
      console.log(`Trace directory: ${traceDir}`);
      process.exitCode = 1;
      return;
    }

    if (options.json) {
      const timelines: Record<string, unknown> = {};
      if (options.timeline) {
        for (const runId of session.runIds) {
          const result = await readRunTraceEvents(runId, traceDir);
          if (result && result.events.length > 0) {
            timelines[runId] = buildRunTimeline(result.events);
          }
        }
      }

      console.log(
        JSON.stringify(
          {
            traceDir,
            session,
            warnings: index.warnings.filter(
              (warning) =>
                warning.sessionId === id || warning.sessionId === undefined,
            ),
            ...(options.timeline ? { timelines } : {}),
          },
          null,
          2,
        ),
      );
      return;
    }

    renderSessionHuman(session, index, options);

    if (options.timeline) {
      for (const runId of session.runIds) {
        const result = await readRunTraceEvents(runId, traceDir);
        if (!result || result.events.length === 0) continue;
        const timeline = buildRunTimeline(result.events);
        console.log("");
        console.log(`Timeline: ${runId}`);
        console.log(renderTimeline(timeline));
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[AgentInspect] session failed: ${msg}`);
    process.exitCode = 1;
  }
}
