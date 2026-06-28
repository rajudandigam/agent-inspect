import {
  TraceDirectory,
  buildRunTimeline,
  buildSessionIndex,
  loadSessionRunRecords,
  loadTraceMetadataList,
  renderTimeline,
  resolveTraceDir,
  type SessionIndex,
  type SessionSummary,
} from "@agent-inspect/core/advanced";

import { readRunTraceEvents } from "./read-run.js";

export interface SessionsCommandOptions {
  dir?: string;
  json?: boolean;
  correlateGroup?: boolean;
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
  correlateGroup?: boolean,
): Promise<SessionIndex> {
  const td = new TraceDirectory({ dir: traceDir });
  const files = await td.list();
  const metas = await loadTraceMetadataList(traceDir, files, (fileName) =>
    td.getPath(fileName),
  );
  const runs = await loadSessionRunRecords(metas);
  return buildSessionIndex(runs, { correlateByGroupId: correlateGroup === true });
}

function findSession(
  index: SessionIndex,
  sessionId: string,
): SessionSummary | undefined {
  return index.sessions.find((session) => session.sessionId === sessionId);
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
    const firstRun = index.runs.find((run) =>
      session.runIds.includes(run.runId),
    );
    const workflowName =
      firstRun?.metadata &&
      typeof firstRun.metadata.workflowName === "string"
        ? firstRun.metadata.workflowName
        : undefined;
    const suffix = workflowName ? ` workflow=${workflowName}` : "";
    console.log(
      `  ${session.sessionId} (${session.runIds.length} run${session.runIds.length === 1 ? "" : "s"})${suffix}`,
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
  console.log(`Runs: ${session.runIds.join(", ")}`);

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

export async function sessionsCommand(
  options: SessionsCommandOptions = {},
): Promise<void> {
  try {
    const traceDir = resolveTraceDir({ dir: options.dir });
    const index = await loadSessionIndex(traceDir, options.correlateGroup);

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
