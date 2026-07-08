import { constants } from "node:fs";
import { access, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  createDefaultWorkspaceManifest,
  parseWorkspaceManifest,
  serializeWorkspaceManifest,
} from "./manifest.js";
import {
  WORKSPACE_DIR_NAME,
  WORKSPACE_MANIFEST_FILENAME,
  type AgentInspectWorkspaceManifest,
  type WorkspaceRedactionProfile,
} from "./types.js";

/**
 * Internal workspace filesystem helpers (v4.0).
 *
 * @remarks
 * Local-only. Never deletes trace files. All manifest-derived paths are
 * resolved and confirmed to stay within the workspace directory
 * (path-traversal guarded). No network access.
 */

/** Resolved on-disk location of a workspace. */
export interface WorkspaceLocation {
  /** Project directory that contains the `.agent-inspect` folder. */
  projectRoot: string;
  /** The `.agent-inspect` workspace directory (root for relative manifest paths). */
  workspaceDir: string;
  /** Absolute path to `workspace.json`. */
  manifestPath: string;
}

const INDEX_DIR_NAME = "index";

/** Resolves the workspace location for a given project directory. */
export function resolveWorkspaceLocation(cwd: string = process.cwd()): WorkspaceLocation {
  const projectRoot = path.resolve(cwd);
  const workspaceDir = path.join(projectRoot, WORKSPACE_DIR_NAME);
  return {
    projectRoot,
    workspaceDir,
    manifestPath: path.join(workspaceDir, WORKSPACE_MANIFEST_FILENAME),
  };
}

/**
 * Resolves a manifest-relative path against the workspace directory, rejecting
 * any path that escapes it.
 */
export function resolveInsideWorkspace(workspaceDir: string, relative: string): string {
  const base = path.resolve(workspaceDir);
  const resolved = path.resolve(base, relative);
  const rel = path.relative(base, resolved);
  if (rel === "" || rel === "." || (!rel.startsWith("..") && !path.isAbsolute(rel))) {
    return resolved;
  }
  throw new Error(
    `Workspace path "${relative}" resolves outside the workspace directory`,
  );
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function isWritable(p: string): Promise<boolean> {
  try {
    await access(p, constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

async function listJsonl(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir);
    return entries.filter((f) => f.endsWith(".jsonl"));
  } catch {
    return [];
  }
}

async function countFiles(dir: string): Promise<number> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries.filter((e) => e.isFile()).length;
  } catch {
    return 0;
  }
}

/** Result of reading a workspace manifest from disk. */
export interface ReadWorkspaceManifestResult {
  exists: boolean;
  ok: boolean;
  manifest?: AgentInspectWorkspaceManifest;
  errors: string[];
  warnings: string[];
}

/** Reads and validates `workspace.json` at the given location. Never throws. */
export async function readWorkspaceManifestFile(
  location: WorkspaceLocation,
): Promise<ReadWorkspaceManifestResult> {
  let raw: string;
  try {
    raw = await readFile(location.manifestPath, "utf-8");
  } catch {
    return { exists: false, ok: false, errors: ["workspace.json not found"], warnings: [] };
  }
  const parsed = parseWorkspaceManifest(raw);
  return {
    exists: true,
    ok: parsed.ok,
    ...(parsed.manifest ? { manifest: parsed.manifest } : {}),
    errors: parsed.errors,
    warnings: parsed.warnings,
  };
}

/** Options for {@link createWorkspace}. */
export interface CreateWorkspaceOptions {
  cwd?: string;
  project?: string;
  redactionProfile?: WorkspaceRedactionProfile;
  /** Preview only: do not write anything to disk. */
  dryRun?: boolean;
}

/** Outcome of {@link createWorkspace}. */
export interface CreateWorkspaceResult {
  location: WorkspaceLocation;
  manifest: AgentInspectWorkspaceManifest;
  /** True when a fresh manifest was written. */
  created: boolean;
  /** True when an existing workspace/trace directory was adopted without rewrite. */
  adopted: boolean;
  /** Relative directories created (or that would be created in dry-run). */
  createdDirs: string[];
  /** True when top-level `.jsonl` traces were detected and preserved. */
  detectedExistingTraces: boolean;
  dryRun: boolean;
}

/**
 * Creates or adopts a workspace. Never deletes or rewrites existing traces.
 * When a manifest already exists it is adopted (missing folders are created,
 * the manifest is left untouched).
 */
export async function createWorkspace(
  options: CreateWorkspaceOptions = {},
): Promise<CreateWorkspaceResult> {
  const location = resolveWorkspaceLocation(options.cwd);
  const dryRun = options.dryRun === true;

  const existing = await readWorkspaceManifestFile(location);
  const topLevelTraces = await listJsonl(location.workspaceDir);
  const detectedExistingTraces = topLevelTraces.length > 0;

  let manifest: AgentInspectWorkspaceManifest;
  let created: boolean;
  let adopted: boolean;

  if (existing.exists && existing.ok && existing.manifest) {
    manifest = existing.manifest;
    created = false;
    adopted = true;
  } else {
    const project =
      options.project?.trim() ||
      path.basename(location.projectRoot) ||
      "workspace";
    const traceDirs = detectedExistingTraces ? ["runs", "."] : ["runs"];
    manifest = createDefaultWorkspaceManifest({
      project,
      traceDirs,
      ...(options.redactionProfile ? { redactionProfile: options.redactionProfile } : {}),
    });
    created = true;
    adopted = detectedExistingTraces || (existing.exists && !existing.ok);
  }

  const relDirs = uniqueDirs([
    ...manifest.traceDirs.filter((d) => d !== "."),
    manifest.reportsDir,
    manifest.artifactsDir,
    manifest.bundlesDir,
    manifest.notesDir,
    INDEX_DIR_NAME,
  ]);

  const createdDirs: string[] = [];
  for (const rel of relDirs) {
    const abs = resolveInsideWorkspace(location.workspaceDir, rel);
    if (await pathExists(abs)) continue;
    createdDirs.push(rel);
    if (!dryRun) await mkdir(abs, { recursive: true });
  }

  if (!dryRun && created) {
    await mkdir(location.workspaceDir, { recursive: true });
    await writeFile(location.manifestPath, serializeWorkspaceManifest(manifest), "utf-8");
  }

  return {
    location,
    manifest,
    created,
    adopted,
    createdDirs,
    detectedExistingTraces,
    dryRun,
  };
}

function uniqueDirs(dirs: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const d of dirs) {
    const t = d.trim();
    if (t === "" || t === "." || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

/** Index presence/status for {@link getWorkspaceStatus}. */
export interface WorkspaceIndexStatus {
  enabled: boolean;
  type: string;
  exists: boolean;
}

/** Aggregate, read-only workspace status. */
export interface WorkspaceStatus {
  project: string;
  traceFiles: number;
  reports: number;
  artifacts: number;
  bundles: number;
  notes: number;
  index: WorkspaceIndexStatus;
}

/** Computes read-only counts for a workspace. Requires a valid manifest. */
export async function getWorkspaceStatus(
  location: WorkspaceLocation,
  manifest: AgentInspectWorkspaceManifest,
): Promise<WorkspaceStatus> {
  let traceFiles = 0;
  for (const rel of manifest.traceDirs) {
    const abs = resolveInsideWorkspace(location.workspaceDir, rel);
    traceFiles += (await listJsonl(abs)).length;
  }

  const reports = await countFiles(
    resolveInsideWorkspace(location.workspaceDir, manifest.reportsDir),
  );
  const artifacts = await countFiles(
    resolveInsideWorkspace(location.workspaceDir, manifest.artifactsDir),
  );
  const bundles = await countFiles(
    resolveInsideWorkspace(location.workspaceDir, manifest.bundlesDir),
  );
  const notes = await countFiles(
    resolveInsideWorkspace(location.workspaceDir, manifest.notesDir),
  );

  const indexPath = manifest.index.path
    ? resolveInsideWorkspace(location.workspaceDir, manifest.index.path)
    : resolveInsideWorkspace(location.workspaceDir, INDEX_DIR_NAME);

  return {
    project: manifest.project,
    traceFiles,
    reports,
    artifacts,
    bundles,
    notes,
    index: {
      enabled: manifest.index.enabled,
      type: manifest.index.type,
      exists: await pathExists(indexPath),
    },
  };
}

/** A single workspace doctor check. */
export interface WorkspaceDoctorCheck {
  id: string;
  status: "pass" | "warn" | "fail";
  message: string;
}

/** Result of {@link doctorWorkspace}. */
export interface WorkspaceDoctorResult {
  ok: boolean;
  checks: WorkspaceDoctorCheck[];
}

/**
 * Validates a workspace: manifest presence/shape, folder permissions, trace
 * readability, and index staleness. Read-only; never throws.
 */
export async function doctorWorkspace(
  location: WorkspaceLocation,
): Promise<WorkspaceDoctorResult> {
  const checks: WorkspaceDoctorCheck[] = [];
  const manifestResult = await readWorkspaceManifestFile(location);

  if (!manifestResult.exists) {
    checks.push({
      id: "manifest",
      status: "fail",
      message: "workspace.json not found (run `agent-inspect workspace init`)",
    });
    return { ok: false, checks };
  }
  if (!manifestResult.ok || !manifestResult.manifest) {
    checks.push({
      id: "manifest",
      status: "fail",
      message: `workspace.json is invalid: ${manifestResult.errors.join("; ")}`,
    });
    return { ok: false, checks };
  }

  const manifest = manifestResult.manifest;
  checks.push({ id: "manifest", status: "pass", message: "workspace.json is valid" });
  for (const warning of manifestResult.warnings) {
    checks.push({ id: "manifest-warning", status: "warn", message: warning });
  }

  const dirFields: Array<[string, string]> = [
    ...manifest.traceDirs
      .filter((d) => d !== ".")
      .map((d, i) => [`traceDir[${i}]`, d] as [string, string]),
    ["reportsDir", manifest.reportsDir],
    ["artifactsDir", manifest.artifactsDir],
    ["bundlesDir", manifest.bundlesDir],
    ["notesDir", manifest.notesDir],
  ];

  for (const [id, rel] of dirFields) {
    let abs: string;
    try {
      abs = resolveInsideWorkspace(location.workspaceDir, rel);
    } catch (error) {
      checks.push({
        id,
        status: "fail",
        message: error instanceof Error ? error.message : String(error),
      });
      continue;
    }
    if (!(await pathExists(abs))) {
      checks.push({ id, status: "warn", message: `${rel}/ does not exist yet` });
    } else if (!(await isWritable(abs))) {
      checks.push({ id, status: "fail", message: `${rel}/ is not writable` });
    } else {
      checks.push({ id, status: "pass", message: `${rel}/ is present and writable` });
    }
  }

  // Trace readability + index staleness.
  let newestTraceMtime = 0;
  for (const rel of manifest.traceDirs) {
    const abs = resolveInsideWorkspace(location.workspaceDir, rel);
    for (const file of await listJsonl(abs)) {
      try {
        const s = await stat(path.join(abs, file));
        newestTraceMtime = Math.max(newestTraceMtime, s.mtimeMs);
      } catch {
        checks.push({ id: "trace-readability", status: "warn", message: `cannot stat ${rel}/${file}` });
      }
    }
  }

  if (manifest.index.enabled) {
    const indexPath = manifest.index.path
      ? resolveInsideWorkspace(location.workspaceDir, manifest.index.path)
      : resolveInsideWorkspace(location.workspaceDir, INDEX_DIR_NAME);
    if (!(await pathExists(indexPath))) {
      checks.push({ id: "index", status: "warn", message: "index enabled but not built" });
    } else {
      try {
        const s = await stat(indexPath);
        if (newestTraceMtime > s.mtimeMs) {
          checks.push({ id: "index", status: "warn", message: "index is stale (traces are newer)" });
        } else {
          checks.push({ id: "index", status: "pass", message: "index is present" });
        }
      } catch {
        checks.push({ id: "index", status: "warn", message: "cannot stat index" });
      }
    }
  }

  const ok = !checks.some((c) => c.status === "fail");
  return { ok, checks };
}

/** Options for {@link cleanWorkspace}. */
export interface CleanWorkspaceOptions {
  /** Actually delete. When false (default), the operation is a dry-run. */
  confirm?: boolean;
}

/** Result of {@link cleanWorkspace}. */
export interface CleanWorkspaceResult {
  dryRun: boolean;
  /** Relative paths removed (or that would be removed in dry-run). */
  removed: string[];
}

/**
 * Removes generated workspace content (reports, artifacts, bundles, index).
 * Dry-run by default; trace directories are never touched.
 */
export async function cleanWorkspace(
  location: WorkspaceLocation,
  manifest: AgentInspectWorkspaceManifest,
  options: CleanWorkspaceOptions = {},
): Promise<CleanWorkspaceResult> {
  const dryRun = options.confirm !== true;
  const targets = uniqueDirs([
    manifest.reportsDir,
    manifest.artifactsDir,
    manifest.bundlesDir,
    manifest.index.path ?? INDEX_DIR_NAME,
  ]);

  const removed: string[] = [];
  for (const rel of targets) {
    const abs = resolveInsideWorkspace(location.workspaceDir, rel);
    let entries: string[];
    try {
      entries = await readdir(abs);
    } catch {
      continue;
    }
    for (const entry of entries) {
      const relPath = `${rel}/${entry}`;
      removed.push(relPath);
      if (!dryRun) {
        await rm(path.join(abs, entry), { recursive: true, force: true });
      }
    }
  }

  return { dryRun, removed };
}
