import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";

import type Database from "better-sqlite3";

import {
  findIngestFileBySourceKey,
  insertIngestFile,
  openStudioDb,
  resolveStudioDbPath,
  type IngestFileKind,
} from "../db.js";
import { importStudioRegistry } from "../import.js";
import { assertPathUnderRoot } from "../path-guards.js";
import { readStudioRegistryFile, type StudioRegistry } from "../registry.js";
import { resolveStudioRegistryPath } from "../registry-path.js";
import {
  buildGitHubArtifactSourceKey,
  parseGitHubRepo,
  resolveImportDirs,
  sanitizeSafeErrorMessage,
  uniqueDestPath,
} from "./common.js";

const DEFAULT_GITHUB_TOKEN_ENV = "GITHUB_TOKEN";
const GITHUB_API_BASE = "https://api.github.com";
const MAX_ARTIFACT_BYTES = 52_428_800;

export type StudioFetch = typeof fetch;

export interface GitHubArtifactImportOptions {
  db: Database.Database;
  registryPath: string;
  registry: StudioRegistry;
  repo: string;
  runId: string;
  artifactName: string;
  /** Explicit opt-in required — disabled by default. */
  enabled: boolean;
  tokenEnv?: string;
  fetchImpl?: StudioFetch;
}

export interface GitHubArtifactImportResult {
  skipped: boolean;
  reason?: string;
  imported: boolean;
  destPath?: string;
  sourceKey?: string;
  contentHash?: string;
  registryImportWarnings: string[];
  errors: string[];
}

interface GitHubArtifactsResponse {
  artifacts?: Array<{
    id?: number;
    name?: string;
    archive_download_url?: string;
    expired?: boolean;
    size_in_bytes?: number;
  }>;
}

function resolveTokenEnv(registry: StudioRegistry, override?: string): string {
  const fromRegistry = registry.ingest?.github?.tokenEnv?.trim();
  const envName = override?.trim() || fromRegistry || DEFAULT_GITHUB_TOKEN_ENV;
  if (!/^[A-Z][A-Z0-9_]*$/.test(envName)) {
    throw new Error("token env name must be an uppercase identifier");
  }
  return envName;
}

function resolveToken(envName: string): string {
  const token = process.env[envName]?.trim();
  if (!token) {
    throw new Error(`missing GitHub token in environment variable ${envName}`);
  }
  return token;
}

function githubHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "agent-inspect-studio-ingest",
  };
}

async function readResponseBody(
  response: Response,
  maxBytes: number,
): Promise<Buffer> {
  const lengthHeader = response.headers.get("content-length");
  if (lengthHeader) {
    const length = Number(lengthHeader);
    if (Number.isFinite(length) && length > maxBytes) {
      throw new Error("artifact exceeds size limit");
    }
  }
  const arrayBuffer = await response.arrayBuffer();
  if (arrayBuffer.byteLength > maxBytes) {
    throw new Error("artifact exceeds size limit");
  }
  return Buffer.from(arrayBuffer);
}

export async function downloadGitHubArtifactArchive(options: {
  repo: string;
  runId: string;
  artifactName: string;
  token: string;
  fetchImpl?: StudioFetch;
}): Promise<Buffer> {
  const fetchFn = options.fetchImpl ?? fetch;
  const { owner, name } = parseGitHubRepo(options.repo);
  const runId = options.runId.trim();
  const artifactName = options.artifactName.trim();
  if (!/^\d+$/.test(runId)) {
    throw new Error("run-id must be a numeric workflow run id");
  }
  if (artifactName === "") {
    throw new Error("artifact name must be non-empty");
  }

  const listUrl = `${GITHUB_API_BASE}/repos/${owner}/${name}/actions/runs/${runId}/artifacts`;
  const listResponse = await fetchFn(listUrl, {
    headers: githubHeaders(options.token),
  });
  if (!listResponse.ok) {
    throw new Error(`GitHub artifact lookup failed (${listResponse.status})`);
  }

  const payload = (await listResponse.json()) as GitHubArtifactsResponse;
  const artifact = payload.artifacts?.find((item) => item.name === artifactName);
  if (!artifact?.archive_download_url) {
    throw new Error(`artifact not found for run ${runId}: ${artifactName}`);
  }
  if (artifact.expired === true) {
    throw new Error(`artifact expired for run ${runId}: ${artifactName}`);
  }
  if (
    typeof artifact.size_in_bytes === "number" &&
    artifact.size_in_bytes > MAX_ARTIFACT_BYTES
  ) {
    throw new Error("artifact exceeds size limit");
  }

  const downloadResponse = await fetchFn(artifact.archive_download_url, {
    headers: githubHeaders(options.token),
    redirect: "follow",
  });
  if (!downloadResponse.ok) {
    throw new Error(`GitHub artifact download failed (${downloadResponse.status})`);
  }

  return readResponseBody(downloadResponse, MAX_ARTIFACT_BYTES);
}

export async function importGitHubArtifact(
  options: GitHubArtifactImportOptions,
): Promise<GitHubArtifactImportResult> {
  const registryImportWarnings: string[] = [];
  const errors: string[] = [];

  if (!options.enabled) {
    return {
      skipped: true,
      reason: "GitHub artifact ingest is disabled; use studio import github explicitly",
      imported: false,
      registryImportWarnings,
      errors,
    };
  }

  let token: string | undefined;
  let tokenEnv: string | undefined;
  try {
    const { owner, name } = parseGitHubRepo(options.repo);
    tokenEnv = resolveTokenEnv(options.registry, options.tokenEnv);
    token = resolveToken(tokenEnv);
    const sourceKey = buildGitHubArtifactSourceKey({
      owner,
      repo: name,
      runId: options.runId,
      artifactName: options.artifactName,
    });

    const archive = await downloadGitHubArtifactArchive({
      repo: options.repo,
      runId: options.runId,
      artifactName: options.artifactName,
      token,
      ...(options.fetchImpl !== undefined ? { fetchImpl: options.fetchImpl } : {}),
    });

    const contentHash = createHash("sha256").update(archive).digest("hex");
    const existing = findIngestFileBySourceKey(options.db, sourceKey);
    if (existing && existing.contentHash === contentHash) {
      return {
        skipped: false,
        imported: false,
        sourceKey,
        contentHash,
        destPath: existing.destPath,
        registryImportWarnings,
        errors,
      };
    }

    const dirs = resolveImportDirs(options.registryPath, options.registry);
    const fileName = `${options.artifactName}.zip`;
    const destPath = uniqueDestPath(dirs.bundlesDir, fileName, contentHash);
    assertPathUnderRoot(destPath, dirs.registryDir);

    await mkdir(dirs.bundlesDir, { recursive: true });
    await writeFile(destPath, archive);

    const importedAt = new Date().toISOString();
    insertIngestFile(options.db, {
      sourceKey,
      sourceName: fileName,
      destPath,
      kind: "bundle" satisfies IngestFileKind,
      contentHash,
      importedAt,
    });

    const registryImport = await importStudioRegistry({
      db: options.db,
      registry: options.registry,
      registryPath: options.registryPath,
    });
    registryImportWarnings.push(...registryImport.warnings);

    return {
      skipped: false,
      imported: true,
      sourceKey,
      contentHash,
      destPath,
      registryImportWarnings,
      errors,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(sanitizeSafeErrorMessage(message, token));
    return {
      skipped: false,
      imported: false,
      registryImportWarnings,
      errors,
    };
  }
}

export async function runStudioGitHubArtifactImport(options: {
  workspacePath?: string;
  dbPath?: string;
  cwd?: string;
  repo: string;
  runId: string;
  artifact: string;
  tokenEnv?: string;
  fetchImpl?: StudioFetch;
}): Promise<GitHubArtifactImportResult> {
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

  return importGitHubArtifact({
    db,
    registryPath,
    registry: registryRead.registry,
    repo: options.repo,
    runId: options.runId,
    artifactName: options.artifact,
    enabled: true,
    ...(options.tokenEnv !== undefined ? { tokenEnv: options.tokenEnv } : {}),
    ...(options.fetchImpl !== undefined ? { fetchImpl: options.fetchImpl } : {}),
  });
}
