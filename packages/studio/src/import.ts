import { readdir } from "node:fs/promises";
import path from "node:path";

import type Database from "better-sqlite3";
import {
  TraceDirectory,
  loadTraceMetadataList,
  resolveTraceDir,
} from "agent-inspect/advanced";
import {
  readWorkspaceManifestFile,
  resolveWorkspaceLocation,
} from "agent-inspect/workspace";

import {
  replaceProjectRuns,
  upsertStudioProject,
  type StudioProjectRow,
  type StudioRunRow,
} from "./db.js";
import {
  resolveRegistryProjectPath,
  type StudioRegistry,
  type StudioRegistryProject,
} from "./registry.js";

export interface ImportedStudioProject extends StudioProjectRow {
  suiteConfigPaths: string[];
}

export interface StudioImportResult {
  registryName: string;
  projects: ImportedStudioProject[];
  warnings: string[];
}

async function discoverSuiteConfigs(
  projectRoot: string,
  configured?: string[],
): Promise<string[]> {
  if (configured && configured.length > 0) {
    return configured.map((rel) => path.resolve(projectRoot, rel));
  }
  const found: string[] = [];
  try {
    const entries = await readdir(projectRoot);
    for (const entry of entries) {
      if (entry.endsWith(".suite.json")) {
        found.push(path.join(projectRoot, entry));
      }
    }
  } catch {
    // ignore unreadable project root
  }
  return found.sort();
}

async function loadProjectRuns(
  workspaceDir: string,
  traceDirs: string[],
): Promise<StudioRunRow[]> {
  const runs: StudioRunRow[] = [];
  for (const rel of traceDirs) {
    const traceDir = resolveTraceDir({ dir: path.join(workspaceDir, rel) });
    const td = new TraceDirectory({ dir: traceDir });
    const files = await td.list();
    const metas = await loadTraceMetadataList(traceDir, files, (fileName) =>
      td.getPath(fileName),
    );
    for (const meta of metas) {
      runs.push({
        projectId: "",
        runId: meta.runId,
        ...(meta.name !== undefined ? { name: meta.name } : {}),
        status: meta.status,
        file: path.basename(meta.filePath),
        ...(meta.startedAt !== undefined ? { startedAt: meta.startedAt } : {}),
        ...(meta.durationMs !== undefined ? { durationMs: meta.durationMs } : {}),
      });
    }
  }
  return runs.sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0));
}

export async function importStudioRegistry(options: {
  db: Database.Database;
  registry: StudioRegistry;
  registryPath: string;
}): Promise<StudioImportResult> {
  const registryDir = path.dirname(options.registryPath);
  const warnings: string[] = [];
  const projects: ImportedStudioProject[] = [];
  const importedAt = new Date().toISOString();

  for (const project of options.registry.projects) {
    const imported = await importStudioProject({
      db: options.db,
      registryDir,
      project,
      importedAt,
      warnings,
    });
    if (imported) projects.push(imported);
  }

  return {
    registryName: options.registry.name,
    projects,
    warnings,
  };
}

async function importStudioProject(options: {
  db: Database.Database;
  registryDir: string;
  project: StudioRegistryProject;
  importedAt: string;
  warnings: string[];
}): Promise<ImportedStudioProject | undefined> {
  const projectRoot = resolveRegistryProjectPath(
    options.registryDir,
    options.project.path,
  );
  const location = resolveWorkspaceLocation(projectRoot);
  const manifestRead = await readWorkspaceManifestFile(location);
  if (!manifestRead.ok || manifestRead.manifest === undefined) {
    options.warnings.push(
      `project "${options.project.id}": ${manifestRead.errors.join("; ") || "workspace.json missing"}`,
    );
    return undefined;
  }

  const runs = await loadProjectRuns(
    location.workspaceDir,
    manifestRead.manifest.traceDirs,
  );
  const suiteConfigPaths = await discoverSuiteConfigs(
    projectRoot,
    options.project.suiteConfigs,
  );

  const row: StudioProjectRow = {
    id: options.project.id,
    label: options.project.label ?? options.project.id,
    path: projectRoot,
    workspaceDir: location.workspaceDir,
    projectName: manifestRead.manifest.project,
    redactionProfile: manifestRead.manifest.redactionProfile,
    traceCount: runs.length,
    importedAt: options.importedAt,
  };

  upsertStudioProject(options.db, row);
  replaceProjectRuns(
    options.db,
    options.project.id,
    runs.map((run) => ({ ...run, projectId: options.project.id })),
  );

  return { ...row, suiteConfigPaths };
}
