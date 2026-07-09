import { readFile } from "node:fs/promises";
import path from "node:path";

import { isSafeRelativePath } from "./path-guards.js";

export const STUDIO_REGISTRY_SCHEMA_VERSION = "1.0" as const;
export const STUDIO_REGISTRY_FILENAMES = [
  "studio-registry.json",
  ".agent-inspect/studio-registry.json",
] as const;

export interface StudioRegistryProject {
  id: string;
  path: string;
  label?: string;
  suiteConfigs?: string[];
}

export interface StudioRegistryImport {
  ciArtifactsDir?: string;
  bundlesDir?: string;
  fileDropDir?: string;
  enabled?: boolean;
}

export interface StudioRegistryGitHubIngest {
  enabled?: boolean;
  tokenEnv?: string;
}

export interface StudioRegistryHttpIngest {
  enabled?: boolean;
  path?: string;
  tokenEnv?: string;
  maxBytes?: number;
}

export interface StudioRegistryBundleUploadIngest {
  enabled?: boolean;
  maxBytes?: number;
}

export interface StudioRegistryIngest {
  github?: StudioRegistryGitHubIngest;
  http?: StudioRegistryHttpIngest;
  bundleUpload?: StudioRegistryBundleUploadIngest;
}

export interface StudioRegistry {
  schemaVersion: typeof STUDIO_REGISTRY_SCHEMA_VERSION;
  name: string;
  projects: StudioRegistryProject[];
  import?: StudioRegistryImport;
  ingest?: StudioRegistryIngest;
}

export interface StudioRegistryParseResult {
  ok: boolean;
  registry?: StudioRegistry;
  errors: string[];
  warnings: string[];
}

const MAX_REGISTRY_BYTES = 256 * 1024;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export { isSafeRelativePath };

export function parseStudioRegistry(input: unknown): StudioRegistryParseResult {
  const errors: string[] = [];
  if (!isPlainObject(input)) {
    return { ok: false, errors: ["registry must be a JSON object"], warnings: [] };
  }
  if (input.schemaVersion !== STUDIO_REGISTRY_SCHEMA_VERSION) {
    errors.push(`schemaVersion must be "${STUDIO_REGISTRY_SCHEMA_VERSION}"`);
  }
  if (typeof input.name !== "string" || input.name.trim() === "") {
    errors.push("name must be a non-empty string");
  }
  if (!Array.isArray(input.projects) || input.projects.length === 0) {
    errors.push("projects must be a non-empty array");
  }

  const projects: StudioRegistryProject[] = [];
  if (Array.isArray(input.projects)) {
    for (const [index, item] of input.projects.entries()) {
      if (!isPlainObject(item)) {
        errors.push(`projects[${index}] must be an object`);
        continue;
      }
      const id = typeof item.id === "string" ? item.id.trim() : "";
      const projectPath = typeof item.path === "string" ? item.path.trim() : "";
      if (!id) errors.push(`projects[${index}].id must be a non-empty string`);
      if (!projectPath) errors.push(`projects[${index}].path must be a non-empty string`);
      const label = typeof item.label === "string" ? item.label.trim() : undefined;
      const suiteConfigs = Array.isArray(item.suiteConfigs)
        ? item.suiteConfigs.filter((value): value is string => typeof value === "string")
        : undefined;
      projects.push({
        id,
        path: projectPath,
        ...(label ? { label } : {}),
        ...(suiteConfigs && suiteConfigs.length > 0 ? { suiteConfigs } : {}),
      });
    }
  }

  let importConfig: StudioRegistryImport | undefined;
  if (input.import !== undefined) {
    if (!isPlainObject(input.import)) {
      errors.push("import must be an object");
    } else {
      importConfig = {};
      if (input.import.ciArtifactsDir !== undefined) {
        const dir = String(input.import.ciArtifactsDir).trim();
        if (!isSafeRelativePath(dir)) {
          errors.push("import.ciArtifactsDir must be a safe relative path");
        } else {
          importConfig.ciArtifactsDir = dir;
        }
      }
      if (input.import.bundlesDir !== undefined) {
        const dir = String(input.import.bundlesDir).trim();
        if (!isSafeRelativePath(dir)) {
          errors.push("import.bundlesDir must be a safe relative path");
        } else {
          importConfig.bundlesDir = dir;
        }
      }
      if (input.import.fileDropDir !== undefined) {
        const dir = String(input.import.fileDropDir).trim();
        if (!isSafeRelativePath(dir)) {
          errors.push("import.fileDropDir must be a safe relative path");
        } else {
          importConfig.fileDropDir = dir;
        }
      }
      if (input.import.enabled !== undefined) {
        if (typeof input.import.enabled !== "boolean") {
          errors.push("import.enabled must be a boolean");
        } else {
          importConfig.enabled = input.import.enabled;
        }
      }
    }
  }

  let ingestConfig: StudioRegistryIngest | undefined;
  const ingestWarnings: string[] = [];
  if (input.ingest !== undefined) {
    if (!isPlainObject(input.ingest)) {
      errors.push("ingest must be an object");
    } else {
      ingestConfig = {};
      if (input.ingest.github !== undefined) {
        if (!isPlainObject(input.ingest.github)) {
          errors.push("ingest.github must be an object");
        } else {
          const github: StudioRegistryGitHubIngest = {};
          if (input.ingest.github.enabled !== undefined) {
            if (typeof input.ingest.github.enabled !== "boolean") {
              errors.push("ingest.github.enabled must be a boolean");
            } else {
              github.enabled = input.ingest.github.enabled;
            }
          }
          if (input.ingest.github.tokenEnv !== undefined) {
            const tokenEnv = String(input.ingest.github.tokenEnv).trim();
            if (!/^[A-Z][A-Z0-9_]*$/.test(tokenEnv)) {
              errors.push("ingest.github.tokenEnv must be an uppercase env var name");
            } else {
              github.tokenEnv = tokenEnv;
            }
          }
          ingestConfig.github = github;
        }
      }
      if (input.ingest.http !== undefined) {
        if (!isPlainObject(input.ingest.http)) {
          errors.push("ingest.http must be an object");
        } else {
          const http: StudioRegistryHttpIngest = {};
          if (input.ingest.http.enabled !== undefined) {
            if (typeof input.ingest.http.enabled !== "boolean") {
              errors.push("ingest.http.enabled must be a boolean");
            } else {
              http.enabled = input.ingest.http.enabled;
            }
          }
          if (input.ingest.http.path !== undefined) {
            const ingestPath = String(input.ingest.http.path).trim();
            if (!ingestPath.startsWith("/") || ingestPath.includes("..")) {
              errors.push("ingest.http.path must be an absolute safe path");
            } else {
              http.path = ingestPath;
            }
          }
          if (input.ingest.http.tokenEnv !== undefined) {
            const tokenEnv = String(input.ingest.http.tokenEnv).trim();
            if (!/^[A-Z][A-Z0-9_]*$/.test(tokenEnv)) {
              errors.push("ingest.http.tokenEnv must be an uppercase env var name");
            } else {
              http.tokenEnv = tokenEnv;
            }
          }
          if (input.ingest.http.maxBytes !== undefined) {
            const maxBytes = Number(input.ingest.http.maxBytes);
            if (!Number.isInteger(maxBytes) || maxBytes <= 0) {
              errors.push("ingest.http.maxBytes must be a positive integer");
            } else {
              http.maxBytes = maxBytes;
            }
          }
          ingestConfig.http = http;
        }
      }
      if (input.ingest.bundleUpload !== undefined) {
        if (!isPlainObject(input.ingest.bundleUpload)) {
          errors.push("ingest.bundleUpload must be an object");
        } else {
          const bundleUpload: StudioRegistryBundleUploadIngest = {};
          if (input.ingest.bundleUpload.enabled !== undefined) {
            if (typeof input.ingest.bundleUpload.enabled !== "boolean") {
              errors.push("ingest.bundleUpload.enabled must be a boolean");
            } else {
              bundleUpload.enabled = input.ingest.bundleUpload.enabled;
            }
          }
          if (input.ingest.bundleUpload.maxBytes !== undefined) {
            const maxBytes = Number(input.ingest.bundleUpload.maxBytes);
            if (!Number.isInteger(maxBytes) || maxBytes <= 0) {
              errors.push("ingest.bundleUpload.maxBytes must be a positive integer");
            } else {
              bundleUpload.maxBytes = maxBytes;
            }
          }
          ingestConfig.bundleUpload = bundleUpload;
        }
      }
      const knownIngestKeys = new Set(["github", "http", "bundleUpload"]);
      for (const key of Object.keys(input.ingest)) {
        if (!knownIngestKeys.has(key)) {
          ingestWarnings.push(`ignored unknown ingest key: ${key}`);
        }
      }
    }
  }

  if (errors.length > 0) return { ok: false, errors, warnings: ingestWarnings };

  return {
    ok: true,
    registry: {
      schemaVersion: STUDIO_REGISTRY_SCHEMA_VERSION,
      name: String(input.name).trim(),
      projects,
      ...(importConfig ? { import: importConfig } : {}),
      ...(ingestConfig ? { ingest: ingestConfig } : {}),
    },
    errors: [],
    warnings: ingestWarnings,
  };
}

export async function readStudioRegistryFile(
  filePath: string,
): Promise<StudioRegistryParseResult & { path: string }> {
  try {
    const raw = await readFile(filePath, "utf8");
    if (raw.length > MAX_REGISTRY_BYTES) {
      return {
        ok: false,
        path: filePath,
        errors: ["registry file exceeds size limit"],
        warnings: [],
      };
    }
    const parsed = parseStudioRegistry(JSON.parse(raw) as unknown);
    return { ...parsed, path: filePath };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, path: filePath, errors: [message], warnings: [] };
  }
}

export function resolveStudioRegistryPath(options: {
  workspacePath?: string;
  cwd?: string;
}): string {
  if (options.workspacePath && options.workspacePath.trim() !== "") {
    return path.resolve(options.cwd ?? process.cwd(), options.workspacePath);
  }
  const cwd = path.resolve(options.cwd ?? process.cwd());
  return path.join(cwd, STUDIO_REGISTRY_FILENAMES[0]!);
}

export function resolveRegistryProjectPath(
  registryDir: string,
  projectPath: string,
): string {
  return path.isAbsolute(projectPath)
    ? path.resolve(projectPath)
    : path.resolve(registryDir, projectPath);
}
