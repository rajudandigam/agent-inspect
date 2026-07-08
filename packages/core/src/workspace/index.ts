/**
 * Internal workspace manifest module (v4.0).
 *
 * @remarks
 * Experimental and internal to `@agent-inspect/core`. Not exported from any
 * published entry point yet; a public `agent-inspect/workspace` subpath is a
 * separate maintainer-gated step (see `docs/proposals/LOCAL-TRACE-WORKSPACE.md`).
 */

export {
  WORKSPACE_SCHEMA_VERSION,
  WORKSPACE_DIR_NAME,
  WORKSPACE_MANIFEST_FILENAME,
  type AgentInspectWorkspaceManifest,
  type WorkspaceIndexConfig,
  type WorkspaceIndexType,
  type WorkspaceManifestValidationResult,
  type WorkspaceRedactionProfile,
} from "./types.js";

export {
  DEFAULT_WORKSPACE_LAYOUT,
  MAX_WORKSPACE_MANIFEST_BYTES,
  type CreateWorkspaceManifestOptions,
  createDefaultWorkspaceManifest,
  isSafeRelativeWorkspacePath,
  parseWorkspaceManifest,
  serializeWorkspaceManifest,
  validateWorkspaceManifest,
} from "./manifest.js";

export {
  type WorkspaceLocation,
  type ReadWorkspaceManifestResult,
  type CreateWorkspaceOptions,
  type CreateWorkspaceResult,
  type WorkspaceIndexStatus,
  type WorkspaceStatus,
  type WorkspaceDoctorCheck,
  type WorkspaceDoctorResult,
  type CleanWorkspaceOptions,
  type CleanWorkspaceResult,
  resolveWorkspaceLocation,
  resolveInsideWorkspace,
  readWorkspaceManifestFile,
  createWorkspace,
  getWorkspaceStatus,
  doctorWorkspace,
  cleanWorkspace,
} from "./fs.js";
