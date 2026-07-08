import {
  WORKSPACE_SCHEMA_VERSION,
  type AgentInspectWorkspaceManifest,
  type WorkspaceIndexConfig,
  type WorkspaceIndexType,
  type WorkspaceManifestValidationResult,
  type WorkspaceRedactionProfile,
} from "./types.js";

/**
 * Internal workspace manifest validation + default generation (v4.0).
 *
 * @remarks
 * Pure, non-throwing helpers. Validation is conservative: unknown or malformed
 * input is rejected with clear messages rather than coerced. No filesystem or
 * network access happens here (filesystem helpers arrive in a later chunk).
 */

/** Default relative layout used when generating a fresh manifest. */
export const DEFAULT_WORKSPACE_LAYOUT = {
  traceDirs: ["runs"],
  reportsDir: "reports",
  artifactsDir: "artifacts",
  bundlesDir: "bundles",
  notesDir: "notes",
} as const;

const DEFAULT_REDACTION_PROFILE: WorkspaceRedactionProfile = "share";

const REDACTION_PROFILES: readonly WorkspaceRedactionProfile[] = [
  "local",
  "share",
  "strict",
];

const INDEX_TYPES: readonly WorkspaceIndexType[] = ["none", "sqlite", "custom"];

/** Upper bound on serialized manifest input accepted by {@link parseWorkspaceManifest}. */
export const MAX_WORKSPACE_MANIFEST_BYTES = 64 * 1024;

/** Options for {@link createDefaultWorkspaceManifest}. */
export interface CreateWorkspaceManifestOptions {
  project: string;
  createdAt?: string;
  traceDirs?: string[];
  reportsDir?: string;
  artifactsDir?: string;
  bundlesDir?: string;
  notesDir?: string;
  redactionProfile?: WorkspaceRedactionProfile;
  index?: Partial<WorkspaceIndexConfig>;
}

/**
 * Generates a default workspace manifest for a project using the standard
 * layout. The returned object is always shape-valid.
 */
export function createDefaultWorkspaceManifest(
  options: CreateWorkspaceManifestOptions,
): AgentInspectWorkspaceManifest {
  const project = typeof options.project === "string" ? options.project.trim() : "";
  const index: WorkspaceIndexConfig = {
    enabled: options.index?.enabled ?? false,
    type: options.index?.type ?? "none",
    ...(options.index?.path !== undefined ? { path: options.index.path } : {}),
  };

  return {
    schemaVersion: WORKSPACE_SCHEMA_VERSION,
    project,
    createdAt: options.createdAt ?? new Date().toISOString(),
    traceDirs: options.traceDirs
      ? [...options.traceDirs]
      : [...DEFAULT_WORKSPACE_LAYOUT.traceDirs],
    reportsDir: options.reportsDir ?? DEFAULT_WORKSPACE_LAYOUT.reportsDir,
    artifactsDir: options.artifactsDir ?? DEFAULT_WORKSPACE_LAYOUT.artifactsDir,
    bundlesDir: options.bundlesDir ?? DEFAULT_WORKSPACE_LAYOUT.bundlesDir,
    notesDir: options.notesDir ?? DEFAULT_WORKSPACE_LAYOUT.notesDir,
    redactionProfile: options.redactionProfile ?? DEFAULT_REDACTION_PROFILE,
    index,
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Returns true when `p` is a non-empty relative path that stays within the
 * workspace root: no absolute paths, no `..` traversal, no Windows drive roots.
 */
export function isSafeRelativeWorkspacePath(p: unknown): p is string {
  if (typeof p !== "string") return false;
  const trimmed = p.trim();
  if (trimmed === "") return false;
  if (trimmed.startsWith("/") || trimmed.startsWith("\\")) return false;
  if (/^[a-zA-Z]:/.test(trimmed)) return false;
  const segments = trimmed.split(/[/\\]+/);
  return !segments.some((seg) => seg === "..");
}

function validateDirField(
  value: unknown,
  field: string,
  errors: string[],
): void {
  if (typeof value !== "string" || value.trim() === "") {
    errors.push(`${field} must be a non-empty string`);
    return;
  }
  if (!isSafeRelativeWorkspacePath(value)) {
    errors.push(
      `${field} must be a relative path inside the workspace (no absolute paths or ".." traversal)`,
    );
  }
}

function validateIndex(value: unknown, errors: string[]): WorkspaceIndexConfig | undefined {
  if (!isPlainObject(value)) {
    errors.push("index must be an object");
    return undefined;
  }
  if (typeof value.enabled !== "boolean") {
    errors.push("index.enabled must be a boolean");
  }
  if (!INDEX_TYPES.includes(value.type as WorkspaceIndexType)) {
    errors.push(`index.type must be one of: ${INDEX_TYPES.join(", ")}`);
  }
  if (value.path !== undefined && !isSafeRelativeWorkspacePath(value.path)) {
    errors.push(
      'index.path must be a relative path inside the workspace (no absolute paths or ".." traversal)',
    );
  }
  if (errors.length > 0) return undefined;
  return {
    enabled: value.enabled as boolean,
    type: value.type as WorkspaceIndexType,
    ...(value.path !== undefined ? { path: value.path as string } : {}),
  };
}

/**
 * Conservatively validates unknown input against the workspace manifest
 * contract. Never throws; returns a result with `ok`, the normalized
 * `manifest` (when valid), `errors`, and non-fatal `warnings`.
 */
export function validateWorkspaceManifest(
  input: unknown,
): WorkspaceManifestValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isPlainObject(input)) {
    return { ok: false, errors: ["manifest must be an object"], warnings };
  }

  if (input.schemaVersion !== WORKSPACE_SCHEMA_VERSION) {
    errors.push(
      `schemaVersion must be "${WORKSPACE_SCHEMA_VERSION}" (received ${JSON.stringify(
        input.schemaVersion,
      )})`,
    );
  }

  if (typeof input.project !== "string" || input.project.trim() === "") {
    errors.push("project must be a non-empty string");
  }

  if (typeof input.createdAt !== "string" || input.createdAt.trim() === "") {
    errors.push("createdAt must be a non-empty ISO-8601 string");
  } else if (Number.isNaN(Date.parse(input.createdAt))) {
    errors.push("createdAt must be a valid ISO-8601 date string");
  }

  if (!Array.isArray(input.traceDirs) || input.traceDirs.length === 0) {
    errors.push("traceDirs must be a non-empty array");
  } else {
    input.traceDirs.forEach((dir, i) => {
      if (typeof dir !== "string" || dir.trim() === "") {
        errors.push(`traceDirs[${i}] must be a non-empty string`);
      } else if (!isSafeRelativeWorkspacePath(dir)) {
        errors.push(
          `traceDirs[${i}] must be a relative path inside the workspace (no absolute paths or ".." traversal)`,
        );
      }
    });
  }

  validateDirField(input.reportsDir, "reportsDir", errors);
  validateDirField(input.artifactsDir, "artifactsDir", errors);
  validateDirField(input.bundlesDir, "bundlesDir", errors);
  validateDirField(input.notesDir, "notesDir", errors);

  if (!REDACTION_PROFILES.includes(input.redactionProfile as WorkspaceRedactionProfile)) {
    errors.push(`redactionProfile must be one of: ${REDACTION_PROFILES.join(", ")}`);
  }

  const indexErrors: string[] = [];
  const index = validateIndex(input.index, indexErrors);
  errors.push(...indexErrors);

  if (index && index.type !== "none" && !index.enabled) {
    warnings.push(`index.type is "${index.type}" but index.enabled is false`);
  }

  if (errors.length > 0 || index === undefined) {
    return { ok: false, errors, warnings };
  }

  const manifest: AgentInspectWorkspaceManifest = {
    schemaVersion: WORKSPACE_SCHEMA_VERSION,
    project: (input.project as string).trim(),
    createdAt: input.createdAt as string,
    traceDirs: (input.traceDirs as string[]).map((d) => d.trim()),
    reportsDir: (input.reportsDir as string).trim(),
    artifactsDir: (input.artifactsDir as string).trim(),
    bundlesDir: (input.bundlesDir as string).trim(),
    notesDir: (input.notesDir as string).trim(),
    redactionProfile: input.redactionProfile as WorkspaceRedactionProfile,
    index,
  };

  return { ok: true, manifest, errors, warnings };
}

/**
 * Safely parses a serialized manifest string and validates it. Bounds input
 * size and rejects invalid JSON without throwing.
 */
export function parseWorkspaceManifest(
  json: string,
): WorkspaceManifestValidationResult {
  const warnings: string[] = [];

  if (typeof json !== "string") {
    return { ok: false, errors: ["manifest input must be a string"], warnings };
  }
  if (json.length > MAX_WORKSPACE_MANIFEST_BYTES) {
    return {
      ok: false,
      errors: [
        `manifest exceeds maximum size of ${MAX_WORKSPACE_MANIFEST_BYTES} bytes`,
      ],
      warnings,
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json) as unknown;
  } catch {
    return { ok: false, errors: ["manifest is not valid JSON"], warnings };
  }

  return validateWorkspaceManifest(parsed);
}

/** Serializes a manifest to deterministic, pretty-printed JSON with a trailing newline. */
export function serializeWorkspaceManifest(
  manifest: AgentInspectWorkspaceManifest,
): string {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}
