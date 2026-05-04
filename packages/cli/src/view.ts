import {
  formatDuration,
  formatTimestamp,
  getDefaultTraceDir,
  getIndent,
  getTraceFilePath,
  readTraceEvents,
  renderErrorLine,
  renderStepLine,
} from "@agent-inspect/core";
import type {
  ErrorInfo,
  RunCompletedEvent,
  RunStartedEvent,
  RunStatus,
  StepCompletedEvent,
  StepStartedEvent,
  StepMetadata,
  StepStatus,
  StepType,
  TraceEvent,
} from "@agent-inspect/core";

export interface ViewOptions {
  dir?: string;
  verbose?: boolean;
  json?: boolean;
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

    const traceDir =
      typeof options.dir === "string" && options.dir.trim() !== ""
        ? options.dir.trim()
        : getDefaultTraceDir();

    const events = await readTraceEvents(id, traceDir);
    if (events.length === 0) {
      console.log(`Run not found: ${id}`);
      console.log(`Trace directory: ${traceDir}`);
      process.exitCode = 1;
      return;
    }

    if (options.json) {
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
    console.log(`Trace file: ${getTraceFilePath(id, traceDir)}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[AgentInspect] view failed: ${msg}`);
    process.exitCode = 1;
  }
}
