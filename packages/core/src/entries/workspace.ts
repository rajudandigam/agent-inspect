/**
 * Public `agent-inspect/workspace` subpath (experimental, v4.0).
 *
 * @remarks
 * Local trace workspace model: the `.agent-inspect/workspace.json` manifest
 * plus local, read-safe filesystem helpers (create/adopt, status, doctor, and
 * dry-run clean). Local-only; no network access. Trace files are never deleted.
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
  DEFAULT_WORKSPACE_LAYOUT,
  MAX_WORKSPACE_MANIFEST_BYTES,
  type CreateWorkspaceManifestOptions,
  createDefaultWorkspaceManifest,
  isSafeRelativeWorkspacePath,
  parseWorkspaceManifest,
  serializeWorkspaceManifest,
  validateWorkspaceManifest,
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
} from "../workspace/index.js";
