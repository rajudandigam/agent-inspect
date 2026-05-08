import { stableJson } from "../exporters/helpers.js";

import type {
  DiffKind,
  DiffOptions,
  DiffPath,
  DiffPathSegment,
  RunComparable,
  RunDiffItem,
  RunDiffResult,
  RunDiffSummary,
  StepComparable,
} from "./types.js";

const DEFAULT_THRESHOLD_MS = 0;

function pathSeg(step: StepComparable, index: number): DiffPathSegment {
  return { index, name: step.name, stepId: step.id };
}

function buildPath(segments: DiffPathSegment[]): DiffPath {
  return { path: [...segments] };
}

/** Pair steps: match by id, then same index, then name+type. */
export function pairSteps(
  left: StepComparable[],
  right: StepComparable[],
): Array<[StepComparable | undefined, StepComparable | undefined]> {
  const usedRight = new Set<string>();
  const pairs: Array<[StepComparable | undefined, StepComparable | undefined]> = [];

  for (let i = 0; i < left.length; i++) {
    const L = left[i]!;
    let R = right.find((r) => !usedRight.has(r.id) && r.id === L.id);
    if (R === undefined && i < right.length && !usedRight.has(right[i]!.id)) {
      const cand = right[i]!;
      if (cand.name === L.name && (cand.type ?? "") === (L.type ?? "")) {
        R = cand;
      }
    }
    if (R === undefined) {
      R = right.find(
        (r) =>
          !usedRight.has(r.id) &&
          r.name === L.name &&
          (r.type ?? "") === (L.type ?? ""),
      );
    }
    if (R !== undefined) {
      usedRight.add(R.id);
      pairs.push([L, R]);
    } else {
      pairs.push([L, undefined]);
    }
  }

  for (const R of right) {
    if (!usedRight.has(R.id)) {
      pairs.push([undefined, R]);
    }
  }

  return pairs;
}

function compareLeafSteps(
  L: StepComparable,
  R: StepComparable,
  segments: DiffPathSegment[],
  opts: Required<Pick<DiffOptions, "ignoreDuration" | "durationThresholdMs">>,
  out: RunDiffItem[],
): void {
  const path = buildPath(segments);

  if (L.name !== R.name) {
    out.push({
      kind: "structure",
      severity: "warning",
      message: "Step name differs",
      path,
      left: L.name,
      right: R.name,
    });
  }

  if ((L.type ?? "") !== (R.type ?? "")) {
    out.push({
      kind: "step-type",
      severity: "warning",
      message: "Step type differs",
      path,
      left: L.type,
      right: R.type,
    });
  }

  if ((L.status ?? "") !== (R.status ?? "")) {
    out.push({
      kind: "step-status",
      severity: "warning",
      message: "Step status differs",
      path,
      left: L.status,
      right: R.status,
    });
  }

  const le = L.error ?? "";
  const re = R.error ?? "";
  if (le !== re) {
    out.push({
      kind: "error",
      severity: "error",
      message: "Step error message differs",
      path,
      left: le || undefined,
      right: re || undefined,
    });
  }

  if (!opts.ignoreDuration) {
    const ld = L.durationMs;
    const rd = R.durationMs;
    const th = opts.durationThresholdMs;
    let differs = false;
    if (ld === undefined && rd === undefined) differs = false;
    else if (ld === undefined || rd === undefined) differs = true;
    else differs = Math.abs(ld - rd) > th;
    if (differs) {
      out.push({
        kind: "duration",
        severity: "info",
        message: "Step duration differs",
        path,
        left: ld,
        right: rd,
      });
    }
  }

  const lm = stableJson(L.metadata ?? {});
  const rm = stableJson(R.metadata ?? {});
  if (lm !== rm) {
    out.push({
      kind: "metadata",
      severity: "info",
      message: "Step metadata differs",
      path,
      left: L.metadata,
      right: R.metadata,
    });
  }

  const lo = stableJson(L.outputPreview ?? null);
  const ro = stableJson(R.outputPreview ?? null);
  if (lo !== ro) {
    out.push({
      kind: "output",
      severity: "info",
      message: "Output preview differs",
      path,
      left: L.outputPreview,
      right: R.outputPreview,
    });
  }
}

function compareRecursive(
  L: StepComparable,
  R: StepComparable,
  segments: DiffPathSegment[],
  opts: Required<Pick<DiffOptions, "ignoreDuration" | "durationThresholdMs">>,
  out: RunDiffItem[],
): void {
  compareLeafSteps(L, R, segments, opts, out);

  const pairs = pairSteps(L.children, R.children);
  let ci = 0;
  for (const [lch, rch] of pairs) {
    if (lch !== undefined && rch !== undefined) {
      compareRecursive(lch, rch, [...segments, pathSeg(lch, ci)], opts, out);
    } else if (lch !== undefined) {
      out.push({
        kind: "step-removed",
        severity: "warning",
        message: `Step only in left run: ${lch.name}`,
        path: buildPath([...segments, pathSeg(lch, ci)]),
        left: lch.id,
        right: undefined,
      });
    } else if (rch !== undefined) {
      out.push({
        kind: "step-added",
        severity: "warning",
        message: `Step only in right run: ${rch.name}`,
        path: buildPath([...segments, pathSeg(rch, ci)]),
        left: undefined,
        right: rch.id,
      });
    }
    ci += 1;
  }
}

function mergeDiffDefaults(options?: DiffOptions): Required<
  Pick<DiffOptions, "ignoreDuration" | "durationThresholdMs" | "focus" | "check">
> {
  return {
    ignoreDuration: options?.ignoreDuration ?? false,
    durationThresholdMs:
      options?.durationThresholdMs !== undefined
        ? options.durationThresholdMs
        : DEFAULT_THRESHOLD_MS,
    focus: options?.focus ?? "all",
    check: options?.check ?? "all",
  };
}

function kindMatchesFilter(kind: DiffKind, merged: ReturnType<typeof mergeDiffDefaults>): boolean {
  const { focus, check } = merged;

  if (check !== "all") {
    if (check === "structure") {
      if (!["step-added", "step-removed", "structure", "step-type"].includes(kind)) return false;
    } else if (check === "outputs") {
      if (!["metadata", "output"].includes(kind)) return false;
    } else if (check === "errors") {
      if (!["run-status", "step-status", "error"].includes(kind)) return false;
    } else if (check === "timing") {
      if (kind !== "duration") return false;
    }
  }

  if (focus !== "all") {
    if (focus === "errors") {
      if (!["run-status", "step-status", "error"].includes(kind)) return false;
    } else if (focus === "structure") {
      if (!["step-added", "step-removed", "structure", "step-type"].includes(kind)) return false;
    } else if (focus === "outputs") {
      if (!["metadata", "output"].includes(kind)) return false;
    }
  }

  return true;
}

export function diffRuns(
  left: RunComparable,
  right: RunComparable,
  options?: DiffOptions,
): RunDiffResult {
  const merged = mergeDiffDefaults(options);
  const opts = {
    ignoreDuration: merged.ignoreDuration,
    durationThresholdMs: merged.durationThresholdMs,
  };

  const raw: RunDiffItem[] = [];

  if ((left.status ?? "") !== (right.status ?? "")) {
    raw.push({
      kind: "run-status",
      severity: "warning",
      message: "Run completion status differs",
      left: left.status,
      right: right.status,
    });
  }

  if (!merged.ignoreDuration) {
    const ld = left.durationMs;
    const rd = right.durationMs;
    const th = merged.durationThresholdMs;
    let differs = false;
    if (ld === undefined && rd === undefined) differs = false;
    else if (ld === undefined || rd === undefined) differs = true;
    else differs = Math.abs(ld - rd) > th;
    if (differs) {
      raw.push({
        kind: "duration",
        severity: "info",
        message: "Run duration differs",
        left: ld,
        right: rd,
      });
    }
  }

  const pairs = pairSteps(left.steps, right.steps);
  let idx = 0;
  for (const [ls, rs] of pairs) {
    if (ls !== undefined && rs !== undefined) {
      compareRecursive(ls, rs, [pathSeg(ls, idx)], opts, raw);
      idx += 1;
    } else if (ls !== undefined) {
      raw.push({
        kind: "step-removed",
        severity: "warning",
        message: `Step only in left run: ${ls.name}`,
        path: buildPath([pathSeg(ls, idx)]),
        left: ls.id,
        right: undefined,
      });
      idx += 1;
    } else if (rs !== undefined) {
      raw.push({
        kind: "step-added",
        severity: "warning",
        message: `Step only in right run: ${rs.name}`,
        path: buildPath([pathSeg(rs, idx)]),
        left: undefined,
        right: rs.id,
      });
      idx += 1;
    }
  }

  const differences = raw.filter((d) => kindMatchesFilter(d.kind, merged));

  let errors = 0;
  let warnings = 0;
  let info = 0;
  for (const d of differences) {
    if (d.severity === "error") errors += 1;
    else if (d.severity === "warning") warnings += 1;
    else info += 1;
  }

  const firstVisible = differences[0];
  const firstDivergence: RunDiffItem | undefined =
    firstVisible !== undefined
      ? {
          kind: "first-divergence",
          severity: firstVisible.severity,
          message: `First divergence: ${firstVisible.message}`,
          path: firstVisible.path,
          left: firstVisible.left,
          right: firstVisible.right,
        }
      : undefined;

  const summary: RunDiffSummary = {
    leftRunId: left.runId,
    rightRunId: right.runId,
    totalDifferences: differences.length,
    errors,
    warnings,
    info,
    firstDivergence,
  };

  return { summary, differences };
}
