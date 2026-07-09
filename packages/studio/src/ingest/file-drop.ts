import { createHash } from "node:crypto";
import {
  copyFile,
  mkdir,
  readdir,
  readFile,
  rename,
  stat,
} from "node:fs/promises";
import path from "node:path";

import type Database from "better-sqlite3";

import {
  findIngestFileBySourceKey,
  insertIngestFile,
  openStudioDb,
  resolveStudioDbPath,
  type IngestFileKind,
} from "../db.js";
import { assertPathUnderRoot, resolveUnderRoot } from "../path-guards.js";
import { readStudioRegistryFile, type StudioRegistry } from "../registry.js";
import { resolveStudioRegistryPath } from "../registry-path.js";

export const FILE_DROP_ARCHIVE_DIR = ".imported";

const CI_EXTENSIONS = [".jsonl", ".suite.json"] as const;
const BUNDLE_EXTENSIONS = [".tgz", ".zip"] as const;

export interface FileDropImportOptions {
  db: Database.Database;
  registryPath: string;
  registry: StudioRegistry;
  /** Explicit opt-in required — ingest is disabled by default. */
  enabled: boolean;
  /** Override drop directory (CLI `--dir`). */
  dropDir?: string;
  /** Move successfully imported files into `dropDir/.imported/` instead of leaving copies. */
  archiveAfterImport?: boolean;
}

export interface FileDropImportedFile {
  sourceKey: string;
  sourceName: string;
  destPath: string;
  kind: IngestFileKind;
  contentHash: string;
  archived: boolean;
}

export interface FileDropImportResult {
  skipped: boolean;
  reason?: string;
  scanned: number;
  imported: number;
  skippedFiles: number;
  errors: string[];
  warnings: string[];
  files: FileDropImportedFile[];
}

function classifyFile(fileName: string): IngestFileKind | undefined {
  const lower = fileName.toLowerCase();
  if (CI_EXTENSIONS.some((ext) => lower.endsWith(ext))) return "ci";
  if (BUNDLE_EXTENSIONS.some((ext) => lower.endsWith(ext))) return "bundle";
  return undefined;
}

async function hashFile(filePath: string): Promise<string> {
  const data = await readFile(filePath);
  return createHash("sha256").update(data).digest("hex");
}

function resolveImportDirs(
  registryPath: string,
  registry: StudioRegistry,
): {
  registryDir: string;
  fileDropDir: string;
  ciArtifactsDir: string;
  bundlesDir: string;
} {
  const registryDir = path.dirname(registryPath);
  const importConfig = registry.import ?? {};
  const fileDropDir = importConfig.fileDropDir ?? "imports/drop";
  const ciArtifactsDir = importConfig.ciArtifactsDir ?? "imports/ci";
  const bundlesDir = importConfig.bundlesDir ?? "imports/bundles";

  return {
    registryDir,
    fileDropDir: resolveUnderRoot(registryDir, fileDropDir),
    ciArtifactsDir: resolveUnderRoot(registryDir, ciArtifactsDir),
    bundlesDir: resolveUnderRoot(registryDir, bundlesDir),
  };
}

function uniqueDestPath(destDir: string, fileName: string, contentHash: string): string {
  const ext = path.extname(fileName);
  const base = path.basename(fileName, ext);
  const shortHash = contentHash.slice(0, 8);
  return path.join(destDir, `${base}-${shortHash}${ext}`);
}

async function importOneFile(options: {
  db: Database.Database;
  sourcePath: string;
  sourceKey: string;
  fileName: string;
  kind: IngestFileKind;
  destDir: string;
  archiveAfterImport: boolean;
  archiveDir: string;
  importedAt: string;
  contentHash: string;
}): Promise<FileDropImportedFile> {
  const destPath = uniqueDestPath(options.destDir, options.fileName, options.contentHash);
  assertPathUnderRoot(destPath, path.dirname(options.destDir));

  await mkdir(options.destDir, { recursive: true });
  await copyFile(options.sourcePath, destPath);

  insertIngestFile(options.db, {
    sourceKey: options.sourceKey,
    sourceName: options.fileName,
    destPath,
    kind: options.kind,
    contentHash: options.contentHash,
    importedAt: options.importedAt,
  });

  let archived = false;
  if (options.archiveAfterImport) {
    await mkdir(options.archiveDir, { recursive: true });
    const archiveTarget = path.join(options.archiveDir, options.fileName);
    await rename(options.sourcePath, archiveTarget);
    archived = true;
  }

  return {
    sourceKey: options.sourceKey,
    sourceName: options.fileName,
    destPath,
    kind: options.kind,
    contentHash: options.contentHash,
    archived,
  };
}

export async function importFileDrop(
  options: FileDropImportOptions,
): Promise<FileDropImportResult> {
  const warnings: string[] = [];
  const errors: string[] = [];
  const files: FileDropImportedFile[] = [];

  if (!options.enabled) {
    return {
      skipped: true,
      reason: "file-drop ingest is disabled; pass --ingest file-drop or use studio import drop",
      scanned: 0,
      imported: 0,
      skippedFiles: 0,
      errors,
      warnings,
      files,
    };
  }

  const dirs = resolveImportDirs(options.registryPath, options.registry);
  let dropDir: string;
  try {
    dropDir = options.dropDir
      ? path.isAbsolute(options.dropDir)
        ? (assertPathUnderRoot(options.dropDir, dirs.registryDir), options.dropDir)
        : resolveUnderRoot(dirs.registryDir, options.dropDir)
      : dirs.fileDropDir;
    assertPathUnderRoot(dropDir, dirs.registryDir);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      skipped: false,
      scanned: 0,
      imported: 0,
      skippedFiles: 0,
      errors: [message],
      warnings,
      files,
    };
  }

  let entries: string[];
  try {
    entries = await readdir(dropDir);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      skipped: false,
      scanned: 0,
      imported: 0,
      skippedFiles: 0,
      errors: [`unable to read file-drop directory: ${message}`],
      warnings,
      files,
    };
  }

  const importedAt = new Date().toISOString();
  const archiveDir = path.join(dropDir, FILE_DROP_ARCHIVE_DIR);
  let scanned = 0;
  let imported = 0;
  let skippedFiles = 0;

  for (const entry of entries.sort()) {
    if (entry === FILE_DROP_ARCHIVE_DIR || entry.startsWith(".")) continue;

    const sourcePath = path.join(dropDir, entry);
    let fileStat;
    try {
      fileStat = await stat(sourcePath);
    } catch {
      warnings.push(`skipped unreadable entry: ${entry}`);
      continue;
    }
    if (!fileStat.isFile()) continue;

    const kind = classifyFile(entry);
    if (!kind) continue;

    scanned += 1;
    const sourceKey = entry;
    let contentHash: string;
    try {
      contentHash = await hashFile(sourcePath);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`failed to read ${entry}: ${message}`);
      continue;
    }

    const existing = findIngestFileBySourceKey(options.db, sourceKey);
    if (existing && existing.contentHash === contentHash) {
      skippedFiles += 1;
      continue;
    }

    const destDir = kind === "ci" ? dirs.ciArtifactsDir : dirs.bundlesDir;
    try {
      const importedFile = await importOneFile({
        db: options.db,
        sourcePath,
        sourceKey,
        fileName: entry,
        kind,
        destDir,
        archiveAfterImport: options.archiveAfterImport === true,
        archiveDir,
        importedAt,
        contentHash,
      });
      files.push(importedFile);
      imported += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`failed to import ${entry}: ${message}`);
    }
  }

  return {
    skipped: false,
    scanned,
    imported,
    skippedFiles,
    errors,
    warnings,
    files,
  };
}

export async function importFileDropFromRegistry(options: {
  db: Database.Database;
  registryPath: string;
  registry: StudioRegistry;
  enabled: boolean;
  dropDir?: string;
  archiveAfterImport?: boolean;
}): Promise<FileDropImportResult> {
  return importFileDrop({
    db: options.db,
    registryPath: options.registryPath,
    registry: options.registry,
    enabled: options.enabled,
    ...(options.dropDir !== undefined ? { dropDir: options.dropDir } : {}),
    ...(options.archiveAfterImport !== undefined
      ? { archiveAfterImport: options.archiveAfterImport }
      : {}),
  });
}

export async function runStudioFileDropImport(options: {
  workspacePath?: string;
  dbPath?: string;
  cwd?: string;
  dropDir?: string;
  archiveAfterImport?: boolean;
}): Promise<FileDropImportResult> {
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

  return importFileDropFromRegistry({
    db,
    registryPath,
    registry: registryRead.registry,
    enabled: true,
    ...(options.dropDir !== undefined ? { dropDir: options.dropDir } : {}),
    ...(options.archiveAfterImport !== undefined
      ? { archiveAfterImport: options.archiveAfterImport }
      : {}),
  });
}
