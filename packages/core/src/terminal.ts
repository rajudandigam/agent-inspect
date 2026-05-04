import chalk from "chalk";

import { isSilentContext } from "./context.js";
import type { ErrorInfo, RunStatus, StepStatus } from "./types.js";
import { formatDuration, truncateName } from "./utils.js";

/** Two spaces per nesting level in terminal output. */
export const TERMINAL_INDENT = "  ";

/** Max display length for names in terminal output. */
export const MAX_TERMINAL_NAME_LENGTH = 80;

/** Max nesting depth used for indentation (prevents huge indents). */
export const MAX_TERMINAL_DEPTH = 10;

function normalizeDepth(depth: number): number {
  if (!Number.isFinite(depth) || depth < 0) {
    return 0;
  }
  return Math.min(Math.floor(depth), MAX_TERMINAL_DEPTH);
}

function safePrint(line = ""): void {
  try {
    console.log(line);
  } catch {
    /* never break callers */
  }
}

/** Indentation string for a nesting depth (capped, never negative). */
export function getIndent(depth: number): string {
  return TERMINAL_INDENT.repeat(normalizeDepth(depth));
}

/** Truncates a display name for terminal use; invalid input becomes `"unnamed"`. */
export function formatTerminalName(name: string): string {
  if (typeof name !== "string" || name.trim() === "") {
    return "unnamed";
  }
  return truncateName(name, MAX_TERMINAL_NAME_LENGTH);
}

function getStatusIcon(status: StepStatus | RunStatus): string {
  if (status === "success") return chalk.green("✔");
  if (status === "error") return chalk.red("✖");
  return chalk.yellow("⏳");
}

/** Renders a single step line (colored); does not consult silent mode. */
export function renderStepLine(
  name: string,
  durationMs: number | undefined,
  status: StepStatus,
  depth?: number,
): string {
  try {
    const nm = formatTerminalName(name);
    const ind = getIndent(depth ?? 0);
    if (status === "running" && durationMs === undefined) {
      return `${ind}${chalk.yellow("⏳")} ${nm}`;
    }
    const hasDur =
      durationMs !== undefined && Number.isFinite(durationMs as number);
    const dur = hasDur ? formatDuration(durationMs as number) : undefined;
    if (status === "running") {
      return dur !== undefined
        ? `${ind}${chalk.yellow("⏳")} ${nm} (${dur})`
        : `${ind}${chalk.yellow("⏳")} ${nm}`;
    }
    if (!hasDur || dur === undefined) {
      return `${ind}${chalk.yellow("⏳")} ${nm}`;
    }
    if (status === "success") {
      return `${ind}${getStatusIcon("success")} ${nm} (${dur})`;
    }
    return `${ind}${getStatusIcon("error")} ${nm} (${dur})`;
  } catch {
    return "";
  }
}

/** Renders an error summary line (no stack in MVP). */
export function renderErrorLine(error: ErrorInfo, depth?: number): string {
  try {
    const msg =
      typeof error.message === "string" ? error.message : "";
    const ind = getIndent((depth ?? 0) + 1);
    return `${ind}Error: ${msg}`;
  } catch {
    return "";
  }
}

/** Plain-text run summary lines (no chalk) for stable testing and CLI reuse. */
export function renderRunSummary(
  durationMs: number,
  status: RunStatus,
  traceFilePath?: string,
): string[] {
  try {
    const dur = Number.isFinite(durationMs)
      ? formatDuration(durationMs)
      : formatDuration(0);
    const head =
      status === "error" ? `Failed in ${dur}` : `Completed in ${dur}`;
    const lines = [head];
    if (traceFilePath !== undefined && traceFilePath.trim() !== "") {
      lines.push(`Trace: ${traceFilePath}`);
    }
    return lines;
  } catch {
    return [];
  }
}

/** Prints run header with icon and dim run id. */
export function printRunStart(runId: string, name: string): void {
  if (isSilentContext()) return;
  try {
    safePrint("");
    const header = `${chalk.cyan.bold("🔍 AgentInspect:")} ${formatTerminalName(name)} ${chalk.dim(`(${runId})`)}`;
    safePrint(header);
  } catch {
    /* noop */
  }
}

/** Prints a running step line. */
export function printStepStart(name: string, depth = 0): void {
  if (isSilentContext()) return;
  try {
    safePrint(renderStepLine(name, undefined, "running", depth));
  } catch {
    /* noop */
  }
}

/** Prints a completed step line with duration and status icon. */
export function printStepComplete(
  name: string,
  durationMs: number,
  status: StepStatus,
  depth = 0,
): void {
  if (isSilentContext()) return;
  try {
    safePrint(renderStepLine(name, durationMs, status, depth));
  } catch {
    /* noop */
  }
}

/** Prints a structured error line (message only, no stack). */
export function printError(error: ErrorInfo, depth = 0): void {
  if (isSilentContext()) return;
  try {
    safePrint(renderErrorLine(error, depth));
  } catch {
    /* noop */
  }
}

/** Prints run completion summary and optional trace path. */
export function printRunComplete(
  _name: string,
  _runId: string,
  durationMs: number,
  status: RunStatus,
  traceFilePath?: string,
): void {
  if (isSilentContext()) return;
  try {
    const lines = renderRunSummary(durationMs, status, traceFilePath);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (i === 0) {
        const color =
          status === "error"
            ? chalk.red
            : status === "running"
              ? chalk.yellow
              : chalk.green;
        safePrint(color(line));
      } else {
        safePrint(chalk.dim(line));
      }
    }
  } catch {
    /* noop */
  }
}

/** Prints which step failed. */
export function printFailedAt(stepName: string): void {
  if (isSilentContext()) return;
  try {
    safePrint(`Failed at: ${formatTerminalName(stepName)}`);
  } catch {
    /* noop */
  }
}
