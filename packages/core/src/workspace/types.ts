/**
 * Internal workspace manifest types (v4.0).
 *
 * @remarks
 * Experimental and internal to `@agent-inspect/core`. This module is not part
 * of any published entry point. Adding a public `agent-inspect/workspace`
 * export is a separate, maintainer-gated step (see
 * `docs/proposals/LOCAL-TRACE-WORKSPACE.md`).
 */

/** Fixed manifest schema version for the v4.0 workspace model. */
export const WORKSPACE_SCHEMA_VERSION = "1.0" as const;

/** Standard workspace directory name at a project root. */
export const WORKSPACE_DIR_NAME = ".agent-inspect" as const;

/** Standard manifest filename inside {@link WORKSPACE_DIR_NAME}. */
export const WORKSPACE_MANIFEST_FILENAME = "workspace.json" as const;

/** Default share-safety posture applied to a workspace. */
export type WorkspaceRedactionProfile = "local" | "share" | "strict";

/** Optional local index kind (SQLite index arrives as an opt-in package in v4.1). */
export type WorkspaceIndexType = "none" | "sqlite" | "custom";

/** Optional local index descriptor. */
export interface WorkspaceIndexConfig {
  enabled: boolean;
  type: WorkspaceIndexType;
  path?: string;
}

/**
 * The `.agent-inspect/workspace.json` manifest.
 *
 * @remarks
 * All directory fields are paths relative to the workspace root and must
 * resolve inside it (no absolute paths, no `..` traversal).
 */
export interface AgentInspectWorkspaceManifest {
  schemaVersion: typeof WORKSPACE_SCHEMA_VERSION;
  project: string;
  createdAt: string;
  traceDirs: string[];
  reportsDir: string;
  artifactsDir: string;
  bundlesDir: string;
  notesDir: string;
  redactionProfile: WorkspaceRedactionProfile;
  index: WorkspaceIndexConfig;
}

/** Result of validating unknown input against the manifest contract. */
export interface WorkspaceManifestValidationResult {
  ok: boolean;
  manifest?: AgentInspectWorkspaceManifest;
  errors: string[];
  warnings: string[];
}
