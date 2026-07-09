import path from "node:path";

import type { StudioRegistry } from "../registry.js";
import { resolveUnderRoot } from "../path-guards.js";

export interface ResolvedImportDirs {
  registryDir: string;
  fileDropDir: string;
  ciArtifactsDir: string;
  bundlesDir: string;
}

export function resolveImportDirs(
  registryPath: string,
  registry: StudioRegistry,
): ResolvedImportDirs {
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

export function uniqueDestPath(destDir: string, fileName: string, contentHash: string): string {
  const ext = path.extname(fileName);
  const base = path.basename(fileName, ext);
  const shortHash = contentHash.slice(0, 8);
  return path.join(destDir, `${base}-${shortHash}${ext}`);
}

export function sanitizeSafeErrorMessage(message: string, secret?: string): string {
  if (!secret || secret.length < 4) return message;
  return message.split(secret).join("[redacted]");
}

export function parseGitHubRepo(repo: string): { owner: string; name: string } {
  const trimmed = repo.trim();
  const match = /^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/.exec(trimmed);
  if (!match) {
    throw new Error("repo must be in owner/name format");
  }
  return { owner: match[1]!, name: match[2]! };
}

export function buildGitHubArtifactSourceKey(options: {
  owner: string;
  repo: string;
  runId: string;
  artifactName: string;
}): string {
  return `github:${options.owner}/${options.repo}/runs/${options.runId}/${options.artifactName}`;
}
