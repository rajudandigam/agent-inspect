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
