import { spawn } from "node:child_process";

export interface CliResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface CliRunner {
  run(args: string[], cwd: string): Promise<CliResult>;
}

/**
 * Invoke the published `agent-inspect` CLI (read-only). Uses npx so workspace
 * and global installs both work without bundling core into the extension.
 */
export function createCliRunner(
  command: string = "npx",
  baseArgs: string[] = ["--yes", "agent-inspect"],
): CliRunner {
  return {
    run(args: string[], cwd: string): Promise<CliResult> {
      return new Promise((resolve) => {
        const child = spawn(command, [...baseArgs, ...args], {
          cwd,
          shell: false,
          env: process.env,
        });
        let stdout = "";
        let stderr = "";
        child.stdout?.on("data", (chunk: Buffer | string) => {
          stdout += String(chunk);
        });
        child.stderr?.on("data", (chunk: Buffer | string) => {
          stderr += String(chunk);
        });
        child.on("close", (code) => {
          resolve({ stdout, stderr, exitCode: code ?? 1 });
        });
        child.on("error", (err) => {
          resolve({ stdout, stderr: `${stderr}${err.message}`, exitCode: 1 });
        });
      });
    },
  };
}

export interface TraceListRow {
  runId: string;
  name?: string;
  status: string;
  durationMs?: number;
  startedAt?: string;
}

export function parseTraceListJson(stdout: string): TraceListRow[] {
  const trimmed = stdout.trim();
  if (!trimmed) return [];
  const parsed: unknown = JSON.parse(trimmed);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter((row): row is Record<string, unknown> => typeof row === "object" && row !== null)
    .map((row) => ({
      runId: String(row.runId ?? ""),
      name: typeof row.name === "string" ? row.name : undefined,
      status: String(row.status ?? "unknown"),
      durationMs: typeof row.durationMs === "number" ? row.durationMs : undefined,
      startedAt: typeof row.startedAt === "string" ? row.startedAt : undefined,
    }))
    .filter((row) => row.runId.length > 0);
}
