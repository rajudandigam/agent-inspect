import { extractSessionWorkflowMetadata } from "../sessions/metadata.js";
import type { SessionRunRecord } from "../sessions/types.js";

export function parseCohortMetricList(value: string | undefined): string[] {
  if (value === undefined || value.trim() === "") return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function parseGroupBySpec(groupBy: string | undefined): {
  kind: "model" | "session" | "group" | "metadata";
  metadataKey?: string;
} {
  const raw = (groupBy ?? "model").trim();
  if (raw === "model") return { kind: "model" };
  if (raw === "session") return { kind: "session" };
  if (raw === "group") return { kind: "group" };
  if (raw.startsWith("metadata.")) {
    const metadataKey = raw.slice("metadata.".length).trim();
    if (metadataKey === "") throw new Error("metadata group-by requires a key.");
    return { kind: "metadata", metadataKey };
  }
  throw new Error(`Unsupported --group-by value: ${raw}`);
}

function metadataString(
  metadata: Record<string, unknown> | undefined,
  key: string,
): string | undefined {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

export function resolveRunGroupKey(
  run: SessionRunRecord,
  groupBy: ReturnType<typeof parseGroupBySpec>,
): string {
  const metadata = run.metadata ?? {};
  switch (groupBy.kind) {
    case "model":
      return metadataString(metadata, "model") ?? "unknown";
    case "session":
      return (
        extractSessionWorkflowMetadata(metadata)?.sessionId ??
        metadataString(metadata, "sessionId") ??
        "__unscoped__"
      );
    case "group":
      return (
        extractSessionWorkflowMetadata(metadata)?.groupId ??
        metadataString(metadata, "groupId") ??
        "__unscoped__"
      );
    case "metadata":
      return metadataString(metadata, groupBy.metadataKey!) ?? "__missing__";
    default:
      return "unknown";
  }
}

export function resolveCohortLabel(
  run: SessionRunRecord,
  cohortKey: string,
  baseline?: string,
  candidate?: string,
): string | undefined {
  const label = metadataString(run.metadata, cohortKey);
  if (label === undefined) return undefined;
  if (baseline !== undefined && label === baseline) return baseline;
  if (candidate !== undefined && label === candidate) return candidate;
  if (baseline === undefined && candidate === undefined) return label;
  return undefined;
}

export function filterRunsForCohort(
  runs: readonly SessionRunRecord[],
  options: {
    cohortKey: string;
    baseline?: string;
    candidate?: string;
  },
): { runs: SessionRunRecord[]; warnings: string[] } {
  const warnings: string[] = [];
  if (options.baseline === undefined && options.candidate === undefined) {
    return { runs: [...runs], warnings };
  }

  const selected: SessionRunRecord[] = [];
  for (const run of runs) {
    const label = resolveCohortLabel(
      run,
      options.cohortKey,
      options.baseline,
      options.candidate,
    );
    if (label !== undefined) selected.push(run);
  }

  if (selected.length === 0) {
    warnings.push(
      `No runs matched baseline/candidate labels on metadata.${options.cohortKey}.`,
    );
  }

  return { runs: selected, warnings };
}
