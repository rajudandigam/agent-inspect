import {
  formatDuration,
  formatTimestamp,
  getIndent,
  getTraceFilePath,
  renderErrorLine,
  renderStepLine,
  buildRunSummary,
  extractMetadata,
  resolveTraceDir,
} from "@agent-inspect/core/advanced";

import { readRunTraceEvents } from "./read-run.js";

import type {
  ErrorInfo,
  RunCompletedEvent,
  RunStartedEvent,
  RunStatus,
  RunSummary,
  TraceMetadata,
  StepCompletedEvent,
  StepStartedEvent,
  StepMetadata,
  StepStatus,
  StepType,
  TraceEvent,
} from "@agent-inspect/core/advanced";

export interface ViewOptions {
  dir?: string;
  summary?: boolean;
  metadata?: boolean;
  errorsOnly?: boolean;
  verbose?: boolean;
  json?: boolean;
  /** Optional interactive TUI (requires @agent-inspect/tui installed). */
  tui?: boolean;
}

function isModuleNotFound(e: unknown): boolean {
  return (
    e !== null &&
    typeof e === "object" &&
    "code" in e &&
    (e as NodeJS.ErrnoException).code === "ERR_MODULE_NOT_FOUND"
  );
}

type StepNode = {
  id: string;
  parentId?: string;
  name: string;
  type: StepType;
  status: StepStatus;
  durationMs?: number;
  error?: ErrorInfo;
  startedAt: number;
  metadata?: StepMetadata;
  children: StepNode[];
};

function buildStepTree(events: TraceEvent[]): StepNode[] {
  const nodes = new Map<string, StepNode>();

  for (const e of events) {
    if (e.event === "step_started") {
      const s = e as StepStartedEvent;
      nodes.set(s.stepId, {
        id: s.stepId,
        parentId: s.parentId,
        name: s.name,
        type: s.type,
        status: "running",
        startedAt: s.startTime,
        metadata: s.metadata,
        children: [],
      });
    }
  }

  for (const e of events) {
    if (e.event !== "step_completed") continue;
    const c = e as StepCompletedEvent;
    const node = nodes.get(c.stepId);
    if (!node) continue;
    node.status = c.status;
    node.durationMs = c.durationMs;
    node.error = c.error;
  }

  const roots: StepNode[] = [];
  for (const n of nodes.values()) {
    if (n.parentId !== undefined && nodes.has(n.parentId)) {
      nodes.get(n.parentId)!.children.push(n);
    } else {
      roots.push(n);
    }
  }

  const sortByStarted = (a: StepNode, b: StepNode) => a.startedAt - b.startedAt;
  roots.sort(sortByStarted);
  for (const n of nodes.values()) {
    n.children.sort(sortByStarted);
  }

  return roots;
}

function printStepTree(
  nodes: StepNode[],
  depth: number,
  verbose: boolean,
): void {
  for (const node of nodes) {
    console.log(
      renderStepLine(node.name, node.durationMs, node.status, depth),
    );
    if (node.error !== undefined) {
      if (verbose) {
        console.log(renderErrorLine(node.error, depth + 1));
        if (
          typeof node.error.stack === "string" &&
          node.error.stack.trim() !== ""
        ) {
          console.log(node.error.stack);
        }
      } else {
        console.log(
          renderErrorLine({ message: node.error.message }, depth + 1),
        );
      }
    }
    if (verbose) {
      console.log(`${getIndent(depth + 1)}type: ${node.type}`);
      if (
        node.metadata !== undefined &&
        Object.keys(node.metadata).length > 0
      ) {
        try {
          console.log(
            `${getIndent(depth + 1)}metadata: ${JSON.stringify(node.metadata)}`,
          );
        } catch {
          /* ignore */
        }
      }
    }
    printStepTree(node.children, depth + 1, verbose);
  }
}

function pickMode(options: ViewOptions): "summary" | "metadata" | "errors-only" | "tree" {
  if (options.summary) return "summary";
  if (options.metadata) return "metadata";
  if (options.errorsOnly) return "errors-only";
  return "tree";
}

function printSummary(summary: RunSummary): void {
  console.log("Run Summary");
  console.log(`ID: ${summary.runId}`);
  console.log(`Name: ${summary.name ?? "unnamed"}`);
  console.log(`Status: ${summary.status}`);
  console.log(
    `Duration: ${
      summary.durationMs !== undefined ? formatDuration(summary.durationMs) : "-"
    }`,
  );
  console.log(`Total steps: ${summary.totalSteps}`);
  console.log(`LLM steps: ${summary.llmSteps}`);
  console.log(`Tool steps: ${summary.toolSteps}`);
  console.log(`Logic steps: ${summary.logicSteps}`);
  console.log(`Error steps: ${summary.errorSteps}`);
  console.log(`Max depth: ${summary.maxDepth}`);
  if (summary.longestStep) {
    console.log(
      `Longest step: ${summary.longestStep.name} (${formatDuration(
        summary.longestStep.durationMs,
      )}, ${summary.longestStep.type})`,
    );
  }
}

function printMetadata(meta: TraceMetadata): void {
  console.log("Trace Metadata");
  console.log(`ID: ${meta.runId}`);
  console.log(`Name: ${meta.name ?? "unnamed"}`);
  console.log(`Status: ${meta.status}`);
  console.log(
    `Started: ${
      meta.startedAt !== undefined ? formatTimestamp(meta.startedAt) : "-"
    }`,
  );
  console.log(
    `Ended: ${meta.endedAt !== undefined ? formatTimestamp(meta.endedAt) : "-"}`,
  );
  console.log(
    `Duration: ${
      meta.durationMs !== undefined ? formatDuration(meta.durationMs) : "-"
    }`,
  );
  console.log(`Event count: ${meta.eventCount}`);
  console.log(`File path: ${meta.filePath}`);
  console.log(`File size: ${meta.fileSize}`);
  console.log(`Created at: ${meta.createdAt.toISOString()}`);
}

function filterErrorEvents(events: TraceEvent[]): TraceEvent[] {
  return events.filter((e) => {
    if (e.event === "run_completed") return (e as RunCompletedEvent).status === "error";
    if (e.event === "step_completed") return (e as StepCompletedEvent).status === "error";
    return false;
  });
}

/**
 * Prints a single run as a tree (or JSON). Missing runs and invalid traces set `process.exitCode`
 * without throwing from normal paths.
 */
export async function view(
  runId: string,
  options: ViewOptions = {},
): Promise<void> {
  try {
    const id =
      typeof runId === "string" && runId.trim() !== "" ? runId.trim() : "";
    if (id === "") {
      console.error("Run id is required");
      process.exitCode = 1;
      return;
    }

    if (options.tui) {
      const conflict =
        options.json ||
        options.summary ||
        options.metadata ||
        options.errorsOnly;
      if (conflict) {
        console.error(
          "--tui cannot be combined with --json, --summary, --metadata, or --errors-only",
        );
        process.exitCode = 1;
        return;
      }
      try {
        const mod = (await import("@agent-inspect/tui")) as {
          runTraceViewer: (o: { runId: string; dir?: string }) => Promise<void>;
        };
        await mod.runTraceViewer({ runId: id, dir: options.dir });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes("interactive terminal")) {
          console.error(msg);
          process.exitCode = 1;
          return;
        }
        if (isModuleNotFound(e)) {
          console.error(
            "TUI support is optional. Install @agent-inspect/tui to use --tui.",
          );
          process.exitCode = 1;
          return;
        }
        console.error(`[AgentInspect] TUI failed: ${msg}`);
        process.exitCode = 1;
      }
      return;
    }

    const traceDir = resolveTraceDir({ dir: options.dir });

    const result = await readRunTraceEvents(id, traceDir);
    const events = result?.events ?? [];
    if (events.length === 0) {
      console.log(`Run not found: ${id}`);
      console.log(`Trace directory: ${traceDir}`);
      process.exitCode = 1;
      return;
    }

    const mode = pickMode(options);
    const filePath = getTraceFilePath(id, traceDir);

    if (mode === "summary") {
      const summary = buildRunSummary(events);
      if (options.json) {
        console.log(JSON.stringify(summary, null, 2));
      } else {
        printSummary(summary);
      }
      return;
    }

    if (mode === "metadata") {
      const meta = await extractMetadata(filePath);
      if (options.json) {
        console.log(JSON.stringify(meta, null, 2));
      } else {
        printMetadata(meta);
      }
      return;
    }

    if (mode === "errors-only") {
      const errEvents = filterErrorEvents(events);
      if (options.json) {
        console.log(JSON.stringify(errEvents, null, 2));
      } else if (errEvents.length === 0) {
        console.log("No errors found in trace");
      } else {
        console.log("Error events");
        console.log(JSON.stringify(errEvents, null, 2));
      }
      return;
    }

    if (options.json) {
      // Preserve existing behavior: --json alone prints raw events.
      console.log(JSON.stringify(events, null, 2));
      return;
    }

    const started = events.find(
      (e): e is RunStartedEvent => e.event === "run_started",
    );
    if (!started) {
      console.error("Invalid trace: missing run_started");
      process.exitCode = 1;
      return;
    }

    const completed = events.filter(
      (e): e is RunCompletedEvent => e.event === "run_completed",
    );
    const last = completed[completed.length - 1];
    const status: RunStatus = last ? last.status : "running";
    const durationLine =
      last !== undefined && Number.isFinite(last.durationMs)
        ? formatDuration(last.durationMs)
        : "-";

    const startedTs = Number.isFinite(started.startTime)
      ? started.startTime
      : started.timestamp;
    const startedLabel = formatTimestamp(startedTs);

    console.log(`AgentInspect Run: ${started.name}`);
    console.log(`ID: ${id}`);
    console.log(`Status: ${status}`);
    console.log(`Duration: ${durationLine}`);
    console.log(`Started: ${startedLabel}`);
    console.log("");

    const tree = buildStepTree(events);
    console.log("Execution Tree:");
    if (tree.length === 0) {
      console.log("No steps recorded");
    } else {
      printStepTree(tree, 0, options.verbose === true);
    }

    console.log("");
    console.log(`Trace file: ${filePath}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[AgentInspect] view failed: ${msg}`);
    process.exitCode = 1;
  }
}
