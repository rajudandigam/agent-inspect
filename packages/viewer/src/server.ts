import { createServer, type Server, type ServerResponse } from "node:http";
import path from "node:path";

import {
  TraceDirectory,
  buildRunTimeline,
  buildSessionIndex,
  loadSessionRunRecords,
  loadTraceMetadataList,
  resolveTraceDir,
} from "agent-inspect/advanced";
import { createRunStatusRule, runTraceChecks } from "agent-inspect/checks";
import { persistedInspectEventsToTraceEvents } from "agent-inspect/persisted";
import { openTrace } from "agent-inspect/readers";

import { viewerIndexHtml } from "./html.js";
import { loadSuiteViewerData } from "./suite-data.js";
import type { ViewerServerInfo, ViewerServerOptions } from "./types.js";
import { loadWorkspaceViewerData } from "./workspace-data.js";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 7337;
const DEFAULT_MAX_EVENTS = 500;

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(payload);
}

function notFound(res: ServerResponse, message: string): void {
  sendJson(res, 404, { error: message });
}

function badRequest(res: ServerResponse, message: string): void {
  sendJson(res, 400, { error: message });
}

function decodeId(segment: string | undefined): string {
  if (!segment) return "";
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function boundedEvents<T>(events: readonly T[], maxEvents: number): T[] {
  if (events.length <= maxEvents) return [...events];
  return events.slice(0, maxEvents);
}

export function createViewerServer(options: ViewerServerOptions = {}): Server {
  const traceDir = resolveTraceDir({ dir: options.traceDir });
  const host = options.host ?? DEFAULT_HOST;
  const port = options.port ?? DEFAULT_PORT;
  const maxEvents = options.maxEvents ?? DEFAULT_MAX_EVENTS;
  const mode = options.mode ?? "traces";

  if (host === "0.0.0.0") {
    console.warn(
      "[AgentInspect viewer] Binding to 0.0.0.0 exposes traces on the network. Use 127.0.0.1 unless you accept that risk.",
    );
  }

  const server = createServer(async (req, res) => {
    try {
      if (req.method !== "GET" && req.method !== "HEAD") {
        return badRequest(res, "Only GET is supported.");
      }

      const url = new URL(req.url ?? "/", `http://${host}:${port}`);
      const pathname = url.pathname;

      if (pathname === "/" || pathname === "/index.html") {
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        res.end(viewerIndexHtml);
        return;
      }

      if (pathname === "/api/health") {
        return sendJson(res, 200, {
          ok: true,
          readOnly: true,
          mode,
          traceDir: path.resolve(traceDir),
        });
      }

      if (pathname === "/api/suite" && mode === "suite") {
        const data = await loadSuiteViewerData({
          suiteConfigPath: options.suiteConfigPath,
          cwd: options.cwd,
        });
        return sendJson(res, 200, data);
      }

      if (pathname === "/api/workspace" && mode === "workspace") {
        const data = await loadWorkspaceViewerData({ cwd: options.cwd });
        return sendJson(res, 200, data);
      }

      const td = new TraceDirectory({ dir: traceDir });

      if (pathname === "/api/traces") {
        const files = await td.list();
        const metas = await loadTraceMetadataList(traceDir, files, (fileName) =>
          td.getPath(fileName),
        );
        return sendJson(
          res,
          200,
          metas.map((meta) => ({
            runId: meta.runId,
            name: meta.name,
            status: meta.status,
            file: path.basename(meta.filePath),
            startedAt: meta.startedAt,
            durationMs: meta.durationMs,
          })),
        );
      }

      if (pathname === "/api/sessions") {
        const files = await td.list();
        const metas = await loadTraceMetadataList(traceDir, files, (fileName) =>
          td.getPath(fileName),
        );
        const runs = await loadSessionRunRecords(metas);
        const index = buildSessionIndex(runs, {
          correlateByGroupId: url.searchParams.get("correlateGroup") === "true",
        });
        return sendJson(res, 200, index);
      }

      const sessionMatch = pathname.match(/^\/api\/session\/([^/]+)$/);
      if (sessionMatch) {
        const sessionId = decodeId(sessionMatch[1]);
        const files = await td.list();
        const metas = await loadTraceMetadataList(traceDir, files, (fileName) =>
          td.getPath(fileName),
        );
        const runs = await loadSessionRunRecords(metas);
        const index = buildSessionIndex(runs, {
          correlateByGroupId: url.searchParams.get("correlateGroup") === "true",
        });
        const session = index.sessions.find((item) => item.sessionId === sessionId);
        if (!session) return notFound(res, `Session not found: ${sessionId}`);
        return sendJson(res, 200, session);
      }

      const traceMatch = pathname.match(/^\/api\/trace\/([^/]+)$/);
      if (traceMatch) {
        const runId = decodeId(traceMatch[1]);
        const files = await td.list();
        const metas = await loadTraceMetadataList(traceDir, files, (fileName) =>
          td.getPath(fileName),
        );
        const meta = metas.find((item) => item.runId === runId);
        if (!meta) return notFound(res, `Run not found: ${runId}`);
        const read = await openTrace({ type: "file", path: meta.filePath });
        const run = read.runs.find((item) => item.runId === runId) ?? read.runs[0];
        return sendJson(res, 200, {
          runId,
          format: read.format,
          run,
          events: boundedEvents(read.events, maxEvents),
          warnings: read.warnings,
          truncated: read.events.length > maxEvents,
        });
      }

      const timelineMatch = pathname.match(/^\/api\/trace\/([^/]+)\/timeline$/);
      if (timelineMatch) {
        const runId = decodeId(timelineMatch[1]);
        const files = await td.list();
        const metas = await loadTraceMetadataList(traceDir, files, (fileName) =>
          td.getPath(fileName),
        );
        const meta = metas.find((item) => item.runId === runId);
        if (!meta) return notFound(res, `Run not found: ${runId}`);
        const read = await openTrace({ type: "file", path: meta.filePath });
        const legacyEvents = persistedInspectEventsToTraceEvents(
          boundedEvents(read.events, maxEvents),
        );
        const timeline = buildRunTimeline(legacyEvents, { focus: "all" });
        return sendJson(res, 200, { runId, timeline });
      }

      const checkMatch = pathname.match(/^\/api\/trace\/([^/]+)\/check$/);
      if (checkMatch) {
        const runId = decodeId(checkMatch[1]);
        const files = await td.list();
        const metas = await loadTraceMetadataList(traceDir, files, (fileName) =>
          td.getPath(fileName),
        );
        const meta = metas.find((item) => item.runId === runId);
        if (!meta) return notFound(res, `Run not found: ${runId}`);
        const read = await openTrace({ type: "file", path: meta.filePath });
        const result = runTraceChecks(
          { read },
          { rules: [createRunStatusRule()], select: ["run.status"], runId },
        );
        return sendJson(res, 200, result);
      }

      return notFound(res, `Unknown route: ${pathname}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      sendJson(res, 500, { error: message });
    }
  });

  return server;
}

export function startViewerServer(
  options: ViewerServerOptions = {},
): Promise<ViewerServerInfo> {
  const host = options.host ?? DEFAULT_HOST;
  const port = options.port ?? DEFAULT_PORT;
  const traceDir = resolveTraceDir({ dir: options.traceDir });
  const mode = options.mode ?? "traces";
  const server = createViewerServer(options);

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      const address = server.address();
      const resolvedPort =
        typeof address === "object" && address ? address.port : port;
      const modeQuery =
        mode === "traces" ? "" : `?mode=${encodeURIComponent(mode)}`;
      resolve({
        host,
        port: resolvedPort,
        traceDir: path.resolve(traceDir),
        url: `http://${host}:${resolvedPort}/${modeQuery}`,
        mode,
      });
    });
  });
}
