import type { IncomingMessage, ServerResponse } from "node:http";

import {
  getImportedProject,
  loadBundleExportView,
  loadProjectChecksView,
  loadProjectDiffView,
  loadProjectGuardrailsView,
  loadProjectObservationsView,
  loadProjectRedactionView,
  loadProjectReportsView,
  loadProjectRunsView,
  loadProjectSearchView,
  loadProjectSessionsView,
  loadProjectSuitesView,
} from "./project-data.js";
import { summarizeProjects, type StudioContext } from "./context.js";
import type { StudioServerOptions } from "./types.js";
import { isStudioRequestAuthorized, studioAuthRequiredResponse } from "./auth.js";

function sendJson(
  res: ServerResponse,
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    ...headers,
  });
  res.end(payload);
}

function notFound(res: ServerResponse, message: string): void {
  sendJson(res, 404, { error: message });
}

function decodeSegment(segment: string | undefined): string {
  if (!segment) return "";
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

export async function handleStudioRoute(
  req: IncomingMessage,
  res: ServerResponse,
  ctx: StudioContext,
  options: StudioServerOptions,
  pathname: string,
  url: URL,
): Promise<boolean> {
  if (!isStudioRequestAuthorized(req, options)) {
    const auth = studioAuthRequiredResponse();
    sendJson(res, auth.status, auth.body, auth.headers);
    return true;
  }

  if (pathname === "/api/health") {
    sendJson(res, 200, {
      ok: true,
      readOnly: true,
      mode: "studio",
      registryName: ctx.registry.name,
      registryPath: ctx.registryPath,
      dbPath: ctx.dbPath,
      projects: summarizeProjects(ctx.projects),
      warnings: ctx.importResult.warnings,
    });
    return true;
  }

  if (pathname === "/api/projects") {
    sendJson(res, 200, {
      registryName: ctx.registry.name,
      projects: summarizeProjects(ctx.projects),
      warnings: ctx.importResult.warnings,
    });
    return true;
  }

  const projectMatch = pathname.match(/^\/api\/projects\/([^/]+)(?:\/(.*))?$/);
  if (projectMatch) {
    const projectId = decodeSegment(projectMatch[1]);
    const subpath = projectMatch[2] ?? "";
    const projectCtx = getImportedProject(ctx.db, ctx.projects, projectId);
    if (!projectCtx) {
      notFound(res, `Project not found: ${projectId}`);
      return true;
    }

    if (subpath === "runs" || subpath === "") {
      sendJson(res, 200, {
        projectId,
        runs: await loadProjectRunsView(projectCtx, ctx.db),
      });
      return true;
    }
    if (subpath === "sessions") {
      sendJson(res, 200, {
        projectId,
        ...(await loadProjectSessionsView(projectCtx)),
      });
      return true;
    }
    if (subpath === "suites") {
      sendJson(res, 200, {
        projectId,
        ...(await loadProjectSuitesView(projectCtx)),
      });
      return true;
    }
    if (subpath === "checks") {
      sendJson(res, 200, {
        projectId,
        ...(await loadProjectChecksView(projectCtx)),
      });
      return true;
    }
    if (subpath === "observations") {
      sendJson(res, 200, {
        projectId,
        ...(await loadProjectObservationsView(projectCtx)),
      });
      return true;
    }
    if (subpath === "guardrails") {
      sendJson(res, 200, {
        projectId,
        ...(await loadProjectGuardrailsView(projectCtx)),
      });
      return true;
    }
    if (subpath === "redaction") {
      sendJson(res, 200, {
        projectId,
        ...(await loadProjectRedactionView(projectCtx)),
      });
      return true;
    }
    if (subpath === "reports") {
      sendJson(res, 200, {
        projectId,
        ...(await loadProjectReportsView(projectCtx)),
      });
      return true;
    }

    notFound(res, `Unknown project route: /${subpath}`);
    return true;
  }

  if (pathname === "/api/search") {
    const projectId = url.searchParams.get("projectId");
    if (!projectId) {
      sendJson(res, 400, { error: "projectId query parameter is required." });
      return true;
    }
    const projectCtx = getImportedProject(ctx.db, ctx.projects, projectId);
    if (!projectCtx) {
      notFound(res, `Project not found: ${projectId}`);
      return true;
    }
    sendJson(res, 200, {
      projectId,
      ...(await loadProjectSearchView(projectCtx, ctx.db, url.searchParams)),
    });
    return true;
  }

  if (pathname === "/api/diff") {
    const projectId = url.searchParams.get("projectId");
    if (!projectId) {
      sendJson(res, 400, { error: "projectId query parameter is required." });
      return true;
    }
    const projectCtx = getImportedProject(ctx.db, ctx.projects, projectId);
    if (!projectCtx) {
      notFound(res, `Project not found: ${projectId}`);
      return true;
    }
    try {
      sendJson(res, 200, {
        projectId,
        ...(await loadProjectDiffView(projectCtx, url.searchParams)),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      sendJson(res, 400, { error: message });
    }
    return true;
  }

  if (pathname === "/api/reports") {
    const projectId = url.searchParams.get("projectId");
    if (!projectId) {
      sendJson(res, 400, { error: "projectId query parameter is required." });
      return true;
    }
    const projectCtx = getImportedProject(ctx.db, ctx.projects, projectId);
    if (!projectCtx) {
      notFound(res, `Project not found: ${projectId}`);
      return true;
    }
    sendJson(res, 200, {
      projectId,
      ...(await loadProjectReportsView(projectCtx)),
    });
    return true;
  }

  if (pathname === "/api/bundles/export") {
    const projectId = url.searchParams.get("projectId");
    if (!projectId) {
      sendJson(res, 400, { error: "projectId query parameter is required." });
      return true;
    }
    const projectCtx = getImportedProject(ctx.db, ctx.projects, projectId);
    if (!projectCtx) {
      notFound(res, `Project not found: ${projectId}`);
      return true;
    }
    try {
      sendJson(res, 200, await loadBundleExportView(projectCtx, url.searchParams));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      sendJson(res, 400, { error: message });
    }
    return true;
  }

  return false;
}
