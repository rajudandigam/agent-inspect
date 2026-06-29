export interface ViewerServerOptions {
  traceDir?: string;
  host?: string;
  port?: number;
  maxEvents?: number;
}

export interface ViewerServerInfo {
  host: string;
  port: number;
  traceDir: string;
  url: string;
}
