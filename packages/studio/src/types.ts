export interface StudioServerOptions {
  host?: string;
  port?: number;
  workspacePath?: string;
  dbPath?: string;
  server?: boolean;
}

export interface StudioServerInfo {
  host: string;
  port: number;
  url: string;
  mode: "studio";
  workspacePath?: string;
  dbPath?: string;
}
