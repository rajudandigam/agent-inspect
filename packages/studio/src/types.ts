import type { StudioAuthMode } from "./auth.js";
import type { StudioContext } from "./context.js";

export interface StudioServerOptions {
  host?: string;
  port?: number;
  workspacePath?: string;
  dbPath?: string;
  server?: boolean;
  cwd?: string;
  auth?: StudioAuthMode;
  passwordEnv?: string;
  /** Test hook: inject a preloaded context instead of importing on startup. */
  context?: StudioContext;
  /** Run file-drop ingest once on startup (requires explicit opt-in). */
  ingestFileDrop?: boolean;
  /** Move imported drop files into `.imported/` after successful copy. */
  archiveFileDrop?: boolean;
}

export interface StudioServerInfo {
  host: string;
  port: number;
  url: string;
  mode: "studio";
  workspacePath?: string;
  dbPath?: string;
  registryName?: string;
  projectCount?: number;
}
