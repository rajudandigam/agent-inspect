export type ViewerMode = "traces" | "suite" | "workspace";

export interface ViewerServerOptions {
  traceDir?: string;
  host?: string;
  port?: number;
  maxEvents?: number;
  mode?: ViewerMode;
  suiteConfigPath?: string;
  cwd?: string;
}

export interface ViewerServerInfo {
  host: string;
  port: number;
  traceDir: string;
  url: string;
  mode: ViewerMode;
}
