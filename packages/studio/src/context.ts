import type Database from "better-sqlite3";

import { importStudioRegistry, type ImportedStudioProject, type StudioImportResult } from "./import.js";
import { importFileDropFromRegistry, type FileDropImportResult } from "./ingest/file-drop.js";
import {
  openStudioDb,
  resolveStudioDbPath,
  type StudioProjectRow,
} from "./db.js";
import {
  readStudioRegistryFile,
  type StudioRegistry,
} from "./registry.js";
import { resolveStudioRegistryPath } from "./registry-path.js";
import type { StudioServerOptions } from "./types.js";

export interface StudioContext {
  db: Database.Database;
  dbPath: string;
  registryPath: string;
  registry: StudioRegistry;
  importResult: StudioImportResult;
  fileDropResult?: FileDropImportResult;
  projects: ImportedStudioProject[];
}

export async function createStudioContext(
  options: StudioServerOptions = {},
): Promise<StudioContext> {
  const cwd = options.cwd ?? process.cwd();
  const registryPath = await resolveStudioRegistryPath({
    ...(options.workspacePath !== undefined ? { workspacePath: options.workspacePath } : {}),
    cwd,
  });
  const registryRead = await readStudioRegistryFile(registryPath);
  if (!registryRead.ok || registryRead.registry === undefined) {
    throw new Error(registryRead.errors.join("; ") || "invalid studio registry");
  }

  const dbPath = resolveStudioDbPath({
    ...(options.dbPath !== undefined ? { dbPath: options.dbPath } : {}),
    cwd,
  });
  const db = openStudioDb(dbPath);
  const importResult = await importStudioRegistry({
    db,
    registry: registryRead.registry,
    registryPath,
  });

  let fileDropResult: FileDropImportResult | undefined;
  if (options.ingestFileDrop === true) {
    fileDropResult = await importFileDropFromRegistry({
      db,
      registryPath,
      registry: registryRead.registry,
      enabled: true,
      ...(options.archiveFileDrop === true ? { archiveAfterImport: true } : {}),
    });
  }

  return {
    db,
    dbPath,
    registryPath,
    registry: registryRead.registry,
    importResult,
    ...(fileDropResult !== undefined ? { fileDropResult } : {}),
    projects: importResult.projects,
  };
}

export function summarizeProjects(projects: StudioProjectRow[]) {
  return projects.map((project) => ({
    id: project.id,
    label: project.label ?? project.id,
    projectName: project.projectName,
    traceCount: project.traceCount,
    redactionProfile: project.redactionProfile,
    importedAt: project.importedAt,
  }));
}
