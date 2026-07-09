import { readFile } from "node:fs/promises";
import path from "node:path";

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
}

export interface StudioRegistry {
  schemaVersion: typeof STUDIO_REGISTRY_SCHEMA_VERSION;
  name: string;
  projects: StudioRegistryProject[];
  import?: StudioRegistryImport;
}

export interface StudioRegistryParseResult {
  ok: boolean;
  registry?: StudioRegistry;
  errors: string[];
}

const MAX_REGISTRY_BYTES = 256 * 1024;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSafeRelativePath(p: string): boolean {
  const trimmed = p.trim();
  if (trimmed === "" || trimmed.startsWith("/") || trimmed.startsWith("\\")) return false;
  if (/^[a-zA-Z]:/.test(trimmed)) return false;
  return !trimmed.split(/[/\\]+/).some((seg) => seg === "..");
}

export function parseStudioRegistry(input: unknown): StudioRegistryParseResult {
  const errors: string[] = [];
  if (!isPlainObject(input)) {
    return { ok: false, errors: ["registry must be a JSON object"] };
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
    }
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    registry: {
      schemaVersion: STUDIO_REGISTRY_SCHEMA_VERSION,
      name: String(input.name).trim(),
      projects,
      ...(importConfig ? { import: importConfig } : {}),
    },
    errors: [],
  };
}

export async function readStudioRegistryFile(
  filePath: string,
): Promise<StudioRegistryParseResult & { path: string }> {
  try {
    const raw = await readFile(filePath, "utf8");
    if (raw.length > MAX_REGISTRY_BYTES) {
      return { ok: false, path: filePath, errors: ["registry file exceeds size limit"] };
    }
    const parsed = parseStudioRegistry(JSON.parse(raw) as unknown);
    return { ...parsed, path: filePath };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, path: filePath, errors: [message] };
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
