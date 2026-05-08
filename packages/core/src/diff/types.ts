export type DiffSeverity = "info" | "warning" | "error";

export type DiffKind =
  | "run-status"
  | "structure"
  | "step-added"
  | "step-removed"
  | "step-status"
  | "step-type"
  | "duration"
  | "error"
  | "metadata"
  | "output"
  | "first-divergence";

export interface DiffPathSegment {
  index: number;
  name: string;
  stepId?: string;
}

export interface DiffPath {
  path: DiffPathSegment[];
}

export interface RunDiffItem {
  kind: DiffKind;
  severity: DiffSeverity;
  message: string;
  path?: DiffPath;
  left?: unknown;
  right?: unknown;
}

export interface StepComparable {
  id: string;
  name: string;
  type?: string;
  status?: string;
  durationMs?: number;
  error?: string;
  metadata?: Record<string, unknown>;
  outputPreview?: unknown;
  children: StepComparable[];
}

export interface RunComparable {
  runId: string;
  name?: string;
  status?: string;
  durationMs?: number;
  steps: StepComparable[];
}

export interface RunDiffSummary {
  leftRunId: string;
  rightRunId: string;
  totalDifferences: number;
  errors: number;
  warnings: number;
  info: number;
  firstDivergence?: RunDiffItem;
}

export interface RunDiffResult {
  summary: RunDiffSummary;
  differences: RunDiffItem[];
}

export interface DiffOptions {
  ignoreDuration?: boolean;
  durationThresholdMs?: number;
  focus?: "all" | "errors" | "structure" | "outputs";
  check?: "all" | "structure" | "outputs" | "errors" | "timing";
}

export interface RenderDiffOptions {
  json?: boolean;
  verbose?: boolean;
  color?: boolean;
}
