import path from "node:path";

import {
  TraceDirectory,
  buildBundleMetadata,
  buildRunTimeline,
  buildRunWhatSummary,
  extractOutcomesFromTraceEvents,
  loadTraceMetadataList,
  renderRunWhat,
  resolveTraceDir,
  searchTraces,
} from "agent-inspect/advanced";
import { createRunStatusRule, runTraceChecks } from "agent-inspect/checks";
import { diffRuns, manualTraceEventsToComparableRun } from "agent-inspect/diff";
import { exportMarkdown, exportRunTree } from "agent-inspect/exporters";
import { persistedInspectEventsToTraceEvents } from "agent-inspect/persisted";
import { openTrace } from "agent-inspect/readers";

export interface McpServerContext {
  traceDir: string;
  maxEvents: number;
  redactionProfile: "local" | "share" | "strict";
}

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export const READ_ONLY_TOOLS: McpToolDefinition[] = [
  {
    name: "list_traces",
    description: "List local trace runs in the configured trace directory.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "read_trace",
    description: "Read a bounded trace projection for one run id.",
    inputSchema: {
      type: "object",
      properties: { runId: { type: "string" } },
      required: ["runId"],
    },
  },
  {
    name: "search_traces",
    description: "Search traces deterministically by query string.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    },
  },
  {
    name: "find_first_error",
    description: "Find the first error step in one run timeline.",
    inputSchema: {
      type: "object",
      properties: { runId: { type: "string" } },
      required: ["runId"],
    },
  },
  {
    name: "find_slowest_path",
    description: "Summarize the slowest steps in one run.",
    inputSchema: {
      type: "object",
      properties: { runId: { type: "string" } },
      required: ["runId"],
    },
  },
  {
    name: "compare_runs",
    description: "Compare two runs and return a bounded structural diff summary.",
    inputSchema: {
      type: "object",
      properties: {
        leftRunId: { type: "string" },
        rightRunId: { type: "string" },
      },
      required: ["leftRunId", "rightRunId"],
    },
  },
  {
    name: "run_checks",
    description: "Run deterministic run.status check for one run.",
    inputSchema: {
      type: "object",
      properties: { runId: { type: "string" } },
      required: ["runId"],
    },
  },
  {
    name: "create_share_safe_report",
    description: "Create a share-profile markdown report for one run.",
    inputSchema: {
      type: "object",
      properties: { runId: { type: "string" } },
      required: ["runId"],
    },
  },
  {
    name: "summarize_failed_run",
    description: "Summarize a failed run with step errors and correlation metadata.",
    inputSchema: {
      type: "object",
      properties: { runId: { type: "string" } },
      required: ["runId"],
    },
  },
  {
    name: "retrieve_decision_notes",
    description: "List decision steps and decision metadata for one run.",
    inputSchema: {
      type: "object",
      properties: { runId: { type: "string" } },
      required: ["runId"],
    },
  },
  {
    name: "find_failed_observation",
    description: "Find failed observed outcomes in one run.",
    inputSchema: {
      type: "object",
      properties: { runId: { type: "string" } },
      required: ["runId"],
    },
  },
  {
    name: "create_share_safe_bundle",
    description: "Create an in-memory share-safe bundle manifest and redacted exports.",
    inputSchema: {
      type: "object",
      properties: { runId: { type: "string" } },
      required: ["runId"],
    },
  },
];

function textResult(payload: unknown) {
  return {
    content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
    isError: false,
  };
}

function errorResult(message: string) {
  return {
    content: [{ type: "text", text: message }],
    isError: true,
  };
}

async function resolveMeta(context: McpServerContext, runId: string) {
  const td = new TraceDirectory({ dir: context.traceDir });
  const files = await td.list();
  const metas = await loadTraceMetadataList(context.traceDir, files, (fileName) =>
    td.getPath(fileName),
  );
  const meta = metas.find((item) => item.runId === runId);
  if (!meta) throw new Error(`Run not found: ${runId}`);
  return meta;
}

async function openRunTrace(context: McpServerContext, runId: string) {
  const meta = await resolveMeta(context, runId);
  const read = await openTrace({ type: "file", path: meta.filePath });
  return { meta, read };
}

function legacyTraceEvents(
  events: Parameters<typeof persistedInspectEventsToTraceEvents>[0],
) {
  return persistedInspectEventsToTraceEvents(events);
}

function redactionProfileForExport(context: McpServerContext): "share" | "strict" {
  return context.redactionProfile === "local" ? "share" : context.redactionProfile;
}

function decisionNotes(events: Parameters<typeof persistedInspectEventsToTraceEvents>[0]) {
  return events
    .filter(
      (event) =>
        event.kind === "DECISION" ||
        (typeof event.attributes?.decisionId === "string" && event.attributes.decisionId !== ""),
    )
    .slice(0, 50)
    .map((event) => ({
      name: event.name,
      kind: event.kind,
      status: event.status,
      decisionId:
        typeof event.attributes?.decisionId === "string" ? event.attributes.decisionId : undefined,
    }));
}

export async function callReadOnlyTool(
  context: McpServerContext,
  name: string,
  args: Record<string, unknown> = {},
) {
  switch (name) {
    case "list_traces": {
      const td = new TraceDirectory({ dir: context.traceDir });
      const files = await td.list();
      const metas = await loadTraceMetadataList(context.traceDir, files, (fileName) =>
        td.getPath(fileName),
      );
      return textResult(
        metas.map((meta) => ({
          runId: meta.runId,
          name: meta.name,
          status: meta.status,
          file: path.basename(meta.filePath),
        })),
      );
    }
    case "read_trace": {
      const runId = String(args.runId ?? "");
      const { read } = await openRunTrace(context, runId);
      const events =
        read.events.length > context.maxEvents
          ? read.events.slice(0, context.maxEvents)
          : read.events;
      return textResult({
        runId,
        format: read.format,
        truncated: read.events.length > events.length,
        events,
      });
    }
    case "search_traces": {
      const query = String(args.query ?? "").trim();
      if (!query) return errorResult("query is required");
      const td = new TraceDirectory({ dir: context.traceDir });
      const files = await td.list();
      const metas = await loadTraceMetadataList(context.traceDir, files, (fileName) =>
        td.getPath(fileName),
      );
      const results = await searchTraces(metas, {
        traceDir: context.traceDir,
        name: query,
        limit: 25,
      });
      return textResult(results);
    }
    case "find_first_error": {
      const runId = String(args.runId ?? "");
      const { read } = await openRunTrace(context, runId);
      const timeline = buildRunTimeline(legacyTraceEvents(read.events));
      const firstError = timeline.entries.find((entry) => entry.isError);
      return textResult({
        runId,
        firstError: firstError ?? null,
      });
    }
    case "find_slowest_path": {
      const runId = String(args.runId ?? "");
      const { read } = await openRunTrace(context, runId);
      const timeline = buildRunTimeline(legacyTraceEvents(read.events), {
        focus: "slow",
        slowTopN: 5,
      });
      const ranked = [...timeline.entries]
        .filter((entry) => entry.durationMs !== undefined && Number.isFinite(entry.durationMs))
        .sort((a, b) => (b.durationMs ?? 0) - (a.durationMs ?? 0))
        .slice(0, 5);
      return textResult({
        runId,
        slowest: ranked[0] ?? null,
        top: ranked,
      });
    }
    case "compare_runs": {
      const leftRunId = String(args.leftRunId ?? "");
      const rightRunId = String(args.rightRunId ?? "");
      const left = await openRunTrace(context, leftRunId);
      const right = await openRunTrace(context, rightRunId);
      const diff = diffRuns(
        manualTraceEventsToComparableRun(legacyTraceEvents(left.read.events)),
        manualTraceEventsToComparableRun(legacyTraceEvents(right.read.events)),
      );
      return textResult({
        summary: diff.summary,
        differences: diff.differences.slice(0, 50),
        truncated: diff.differences.length > 50,
      });
    }
    case "run_checks": {
      const runId = String(args.runId ?? "");
      const { read } = await openRunTrace(context, runId);
      const result = runTraceChecks(
        { read },
        { rules: [createRunStatusRule()], select: ["run.status"], runId },
      );
      return textResult(result);
    }
    case "create_share_safe_report": {
      const runId = String(args.runId ?? "");
      const { read } = await openRunTrace(context, runId);
      const run = read.runs.find((item) => item.runId === runId) ?? read.runs[0];
      if (!run) return errorResult(`Run tree not found: ${runId}`);
      const profile = redactionProfileForExport(context);
      const markdown = exportMarkdown(run, {
        format: "markdown",
        redacted: true,
        redactionProfile: profile,
      });
      return textResult({ runId, profile, markdown: markdown.content });
    }
    case "summarize_failed_run": {
      const runId = String(args.runId ?? "");
      const { read } = await openRunTrace(context, runId);
      const traceEvents = legacyTraceEvents(read.events);
      const summary = buildRunWhatSummary(traceEvents);
      return textResult({
        runId,
        status: summary.status,
        summary: renderRunWhat(summary),
        failedStepNames: summary.failedStepNames,
        correlation: summary.correlation ?? null,
      });
    }
    case "retrieve_decision_notes": {
      const runId = String(args.runId ?? "");
      const { read } = await openRunTrace(context, runId);
      const notes = decisionNotes(read.events);
      return textResult({ runId, decisions: notes, count: notes.length });
    }
    case "find_failed_observation": {
      const runId = String(args.runId ?? "");
      const { read } = await openRunTrace(context, runId);
      const outcomes = extractOutcomesFromTraceEvents(legacyTraceEvents(read.events));
      const failed = outcomes.filter((outcome) => outcome.status === "failed");
      return textResult({
        runId,
        failed,
        count: failed.length,
      });
    }
    case "create_share_safe_bundle": {
      const runId = String(args.runId ?? "");
      const { read } = await openRunTrace(context, runId);
      const run = read.runs.find((item) => item.runId === runId) ?? read.runs[0];
      if (!run) return errorResult(`Run tree not found: ${runId}`);
      const profile = redactionProfileForExport(context);
      const markdown = exportMarkdown(run, {
        format: "markdown",
        redacted: true,
        redactionProfile: profile,
      });
      const tree = exportRunTree(run, {
        format: "openinference",
        redacted: true,
        redactionProfile: profile,
      });
      const metadata = buildBundleMetadata({
        agentInspectVersion: "mcp-server",
        profile,
        resolve: { runIds: [runId] },
        checks: {
          aggregateStatus: "SAFE",
          runs: [{ runId, status: "SAFE", errors: 0, warnings: 0, findings: 0 }],
        },
        files: ["report.md", "tree.json"],
      });
      return textResult({
        runId,
        profile,
        metadata,
        files: {
          "report.md": markdown.content,
          "tree.json": tree.content,
        },
      });
    }
    default:
      return errorResult(`Unknown tool: ${name}`);
  }
}

export function createMcpServerContext(options: {
  traceDir?: string;
  maxEvents?: number;
  redactionProfile?: "local" | "share" | "strict";
} = {}): McpServerContext {
  return {
    traceDir: resolveTraceDir({ dir: options.traceDir }),
    maxEvents: options.maxEvents ?? 500,
    redactionProfile: options.redactionProfile ?? "share",
  };
}
