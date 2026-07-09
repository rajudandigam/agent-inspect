import { readdir, stat } from "node:fs/promises";
import path from "node:path";

import type Database from "better-sqlite3";
import {
  TraceDirectory,
  buildRunTimeline,
  buildSessionIndex,
  extractOutcomesFromTraceEvents,
  loadSessionRunRecords,
  loadTraceMetadataList,
  resolveTraceDir,
  runSuite,
  searchTraces,
} from "agent-inspect/advanced";
import { createRunStatusRule, runTraceChecks } from "agent-inspect/checks";
import { diffRuns, manualTraceEventsToComparableRun } from "agent-inspect/diff";
import { persistedInspectEventsToTraceEvents } from "agent-inspect/persisted";
import { openTrace } from "agent-inspect/readers";
import {
  readWorkspaceManifestFile,
  resolveWorkspaceLocation,
} from "agent-inspect/workspace";

import { getStudioProject, listProjectRuns, searchProjectRuns } from "./db.js";
import type { ImportedStudioProject } from "./import.js";

export interface StudioProjectContext {
  project: ImportedStudioProject;
}

export function getImportedProject(
  db: Database.Database,
  projects: ImportedStudioProject[],
  projectId: string,
): StudioProjectContext | undefined {
  const cached = projects.find((item) => item.id === projectId);
  if (cached) return { project: cached };
  const row = getStudioProject(db, projectId);
  if (!row) return undefined;
  return {
    project: {
      ...row,
      suiteConfigPaths: [],
    },
  };
}

async function loadTraceDirMetas(workspaceDir: string, traceDirs: string[]) {
  const metas = [];
  for (const rel of traceDirs) {
    const traceDir = resolveTraceDir({ dir: path.join(workspaceDir, rel) });
    const td = new TraceDirectory({ dir: traceDir });
    const files = await td.list();
    const listed = await loadTraceMetadataList(traceDir, files, (fileName) =>
      td.getPath(fileName),
    );
    metas.push(...listed);
  }
  return metas;
}

export async function loadProjectRunsView(
  ctx: StudioProjectContext,
  db: Database.Database,
  limit = 200,
) {
  return listProjectRuns(db, ctx.project.id, limit);
}

export async function loadProjectSessionsView(ctx: StudioProjectContext) {
  const location = resolveWorkspaceLocation(ctx.project.path);
  const manifestRead = await readWorkspaceManifestFile(location);
  const traceDirs = manifestRead.manifest?.traceDirs ?? ["runs"];
  const metas = await loadTraceDirMetas(ctx.project.workspaceDir, traceDirs);
  const runs = await loadSessionRunRecords(metas);
  return buildSessionIndex(runs, { correlateByGroupId: true });
}

export async function loadProjectSuitesView(ctx: StudioProjectContext) {
  const suites = [];
  for (const configPath of ctx.project.suiteConfigPaths) {
    try {
      const result = await runSuite({
        configPath,
        cwd: path.dirname(configPath),
      });
      suites.push({
        suiteName: result.suiteName,
        configPath: result.configPath,
        ok: result.ok,
        status: result.status,
        summary: result.summary,
        cases: result.cases.map((item) => ({
          id: item.id,
          status: item.status,
          ...(item.runId !== undefined ? { runId: item.runId } : {}),
          ...(item.message !== undefined ? { message: item.message } : {}),
        })),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      suites.push({
        suiteName: path.basename(configPath),
        configPath,
        ok: false,
        status: "error" as const,
        summary: { total: 0, passed: 0, failed: 0, skipped: 0 },
        cases: [],
        error: message,
      });
    }
  }
  return { suites };
}

export async function loadProjectChecksView(ctx: StudioProjectContext) {
  const metas = await loadTraceDirMetas(ctx.project.workspaceDir, ["runs"]);
  const results = [];
  for (const meta of metas.slice(0, 20)) {
    try {
      const read = await openTrace({ type: "file", path: meta.filePath });
      const result = runTraceChecks(
        { read },
        { rules: [createRunStatusRule()], select: ["run.status"], runId: meta.runId },
      );
      results.push({
        runId: meta.runId,
        ok: result.ok,
        summary: result.summary,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({ runId: meta.runId, ok: false, error: message });
    }
  }
  return { checks: results };
}

export async function loadProjectSearchView(
  ctx: StudioProjectContext,
  db: Database.Database,
  params: URLSearchParams,
) {
  const q = params.get("q")?.trim() ?? "";
  if (q) {
    return {
      query: q,
      results: searchProjectRuns(
        db,
        ctx.project.id,
        q,
        Number(params.get("limit") ?? 50),
      ),
    };
  }
  const metas = await loadTraceDirMetas(ctx.project.workspaceDir, ["runs"]);
  const traceDir = resolveTraceDir({
    dir: path.join(ctx.project.workspaceDir, "runs"),
  });
  const results = await searchTraces(metas, {
    traceDir,
    ...(params.get("status")
      ? { status: params.get("status") as "success" | "error" | "running" | "unknown" }
      : {}),
    ...(params.get("name") ? { name: params.get("name") ?? undefined } : {}),
    ...(params.get("tool") ? { tool: params.get("tool") ?? undefined } : {}),
    limit: Number(params.get("limit") ?? 50),
  });
  return { query: q, results };
}

export async function loadProjectDiffView(
  ctx: StudioProjectContext,
  params: URLSearchParams,
) {
  const leftRunId = params.get("left");
  const rightRunId = params.get("right");
  if (!leftRunId || !rightRunId) {
    throw new Error("left and right run ids are required.");
  }
  const metas = await loadTraceDirMetas(ctx.project.workspaceDir, ["runs"]);
  const leftMeta = metas.find((item) => item.runId === leftRunId);
  const rightMeta = metas.find((item) => item.runId === rightRunId);
  if (!leftMeta || !rightMeta) {
    throw new Error("One or both runs were not found in the project workspace.");
  }
  const leftRead = await openTrace({ type: "file", path: leftMeta.filePath });
  const rightRead = await openTrace({ type: "file", path: rightMeta.filePath });
  const diff = diffRuns(
    manualTraceEventsToComparableRun(
      persistedInspectEventsToTraceEvents(leftRead.events),
    ),
    manualTraceEventsToComparableRun(
      persistedInspectEventsToTraceEvents(rightRead.events),
    ),
  );
  return {
    leftRunId,
    rightRunId,
    summary: diff.summary,
    differences: diff.differences.slice(0, 50).map((item) => ({
      kind: item.kind,
      message: item.message,
    })),
  };
}

export async function loadProjectReportsView(ctx: StudioProjectContext) {
  const reportsDir = path.join(ctx.project.workspaceDir, "reports");
  const reports: Array<{ name: string; path: string; sizeBytes: number }> = [];
  try {
    const files = await readdir(reportsDir);
    for (const file of files) {
      const filePath = path.join(reportsDir, file);
      const info = await stat(filePath);
      if (!info.isFile()) continue;
      reports.push({ name: file, path: filePath, sizeBytes: info.size });
    }
  } catch {
    // missing reports dir
  }
  return { reports: reports.sort((a, b) => a.name.localeCompare(b.name)) };
}

export async function loadProjectObservationsView(ctx: StudioProjectContext) {
  const metas = await loadTraceDirMetas(ctx.project.workspaceDir, ["runs"]);
  const observations = [];
  for (const meta of metas.slice(0, 20)) {
    try {
      const read = await openTrace({ type: "file", path: meta.filePath });
      const legacy = persistedInspectEventsToTraceEvents(read.events);
      observations.push({
        runId: meta.runId,
        items: extractOutcomesFromTraceEvents(legacy),
        timeline: buildRunTimeline(legacy, { focus: "all" }).entries
          .filter((entry) => entry.type === "tool")
          .map((entry) => entry.name),
      });
    } catch {
      observations.push({ runId: meta.runId, items: [], timeline: [] });
    }
  }
  return { observations };
}

export async function loadProjectGuardrailsView(ctx: StudioProjectContext) {
  return {
    guardrails: {
      message:
        "Guardrail evaluation is available via CLI (`agent-inspect scan`). Studio surfaces structural status only in v6.0.",
      redactionProfile: ctx.project.redactionProfile ?? "share",
      circuitWarnings: [],
    },
  };
}

export async function loadProjectRedactionView(ctx: StudioProjectContext) {
  return {
    redaction: {
      profile: ctx.project.redactionProfile ?? "share",
      hint: "Structural share-safety posture from workspace.json — not certification.",
      bundleCommand: `npx agent-inspect bundle <runId> --profile ${ctx.project.redactionProfile ?? "share"}`,
    },
  };
}

export async function loadBundleExportView(
  ctx: StudioProjectContext,
  params: URLSearchParams,
) {
  const runId = params.get("runId");
  if (!runId) {
    throw new Error("runId query parameter is required.");
  }
  return {
    projectId: ctx.project.id,
    runId,
    readOnly: true,
    redactionProfile: ctx.project.redactionProfile ?? "share",
    cliHint: `npx agent-inspect bundle ${runId} --profile ${ctx.project.redactionProfile ?? "share"} --dir ${path.join(ctx.project.workspaceDir, "runs")}`,
    note: "Studio does not mutate traces or upload bundles. Run the CLI locally to assemble a share-safe bundle.",
  };
}
