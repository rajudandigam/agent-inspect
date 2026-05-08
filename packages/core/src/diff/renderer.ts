import chalk from "chalk";

import type { RenderDiffOptions, RunDiffResult } from "./types.js";

function formatPath(path?: import("./types.js").DiffPath): string {
  if (path === undefined || path.path.length === 0) {
    return "(run)";
  }
  return path.path.map((s) => s.name).join(" > ");
}

function formatValue(v: unknown, verbose: boolean): string {
  if (v === undefined) return "(undefined)";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  const s = JSON.stringify(v);
  if (verbose || s.length <= 120) return s;
  return `${s.slice(0, 117)}...`;
}

export function renderRunDiff(result: RunDiffResult, options?: RenderDiffOptions): string {
  const json = options?.json === true;
  const verbose = options?.verbose === true;
  const color = options?.color === true;

  if (json) {
    return JSON.stringify(result, null, 2);
  }

  const sev = (s: string, level: "error" | "warning" | "info"): string => {
    if (!color) return s;
    if (level === "error") return chalk.red(s);
    if (level === "warning") return chalk.yellow(s);
    return chalk.gray(s);
  };

  const lines: string[] = [];
  const { summary } = result;

  lines.push("Run diff");
  lines.push(`Left:  ${summary.leftRunId}`);
  lines.push(`Right: ${summary.rightRunId}`);
  lines.push("");
  lines.push("Summary:");
  lines.push(`  Differences: ${summary.totalDifferences}`);
  lines.push(`  Errors: ${summary.errors}`);
  lines.push(`  Warnings: ${summary.warnings}`);
  lines.push(`  Info: ${summary.info}`);
  lines.push("");

  const fd = summary.firstDivergence;
  const firstKind = result.differences[0]?.kind;
  if (fd !== undefined) {
    lines.push("First divergence:");
    const where = formatPath(fd.path);
    const displayKind = firstKind ?? fd.kind;
    lines.push(`  ${displayKind} at ${where}`);
    if (fd.left !== undefined || fd.right !== undefined) {
      lines.push(`    left: ${formatValue(fd.left, verbose)}`);
      lines.push(`    right: ${formatValue(fd.right, verbose)}`);
    }
    lines.push("");
  }

  lines.push("Differences:");
  if (result.differences.length === 0) {
    lines.push("  (none)");
    return lines.join("\n");
  }

  const showSides = (kind: string): boolean =>
    verbose ||
    [
      "run-status",
      "step-status",
      "error",
      "duration",
      "step-type",
      "structure",
      "step-added",
      "step-removed",
    ].includes(kind);

  for (const d of result.differences) {
    const tag = sev(`[${d.severity}]`, d.severity);
    const pathStr = d.path !== undefined ? ` ${formatPath(d.path)}` : "";
    lines.push(`  ${tag} ${d.kind}${pathStr}`);
    lines.push(`    ${d.message}`);
    if (d.left !== undefined || d.right !== undefined) {
      if (showSides(d.kind)) {
        lines.push(`    left: ${formatValue(d.left, verbose)}`);
        lines.push(`    right: ${formatValue(d.right, verbose)}`);
      }
    }
  }

  return lines.join("\n");
}
