import { startViewerServer } from "@agent-inspect/viewer";

export interface ServeCommandOptions {
  dir?: string;
  host?: string;
  port?: string;
  open?: boolean;
  suite?: boolean;
  workspace?: boolean;
  config?: string;
  cwd?: string;
}

function parsePort(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    throw new Error("--port must be an integer between 1 and 65535.");
  }
  return parsed;
}

export async function serveCommand(options: ServeCommandOptions = {}): Promise<void> {
  const port = parsePort(options.port);
  const host = options.host?.trim() || "127.0.0.1";
  const mode = options.suite ? "suite" : options.workspace ? "workspace" : "traces";
  const info = await startViewerServer({
    ...(options.dir !== undefined ? { traceDir: options.dir } : {}),
    host,
    ...(port !== undefined ? { port } : {}),
    mode,
    ...(options.config !== undefined ? { suiteConfigPath: options.config } : {}),
    ...(options.cwd !== undefined ? { cwd: options.cwd } : {}),
  });

  console.log(`AgentInspect viewer (read-only, ${info.mode}): ${info.url}`);
  if (info.mode === "traces") {
    console.log(`Trace directory: ${info.traceDir}`);
  }

  if (options.open === true && host !== "127.0.0.1" && host !== "localhost") {
    console.warn("Skipping browser open for non-local host binding.");
  } else if (options.open === true) {
    const openMod = await import("node:child_process");
    openMod.exec(`open ${info.url}`, () => {});
  }

  await new Promise<void>(() => {
    // Keep process alive until interrupted.
  });
}
