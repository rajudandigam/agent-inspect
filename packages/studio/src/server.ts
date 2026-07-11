import { createServer, type Server, type ServerResponse } from "node:http";

import { createStudioContext, type StudioContext } from "./context.js";
import { handleHttpIngestRequest, isHttpIngestRoute, resolveHttpIngestConfig } from "./ingest/http.js";
import { studioIndexHtml } from "./html.js";
import { handleStudioRoute } from "./routes.js";
import type { StudioServerInfo, StudioServerOptions } from "./types.js";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 7340;

function badRequest(res: ServerResponse, message: string): void {
  res.writeHead(400, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(JSON.stringify({ error: message }));
}

function resolveHost(options: StudioServerOptions): string {
  if (options.server === true) {
    return options.host ?? "0.0.0.0";
  }
  return options.host ?? DEFAULT_HOST;
}

export function createStudioServer(options: StudioServerOptions = {}): Server {
  const host = resolveHost(options);
  const port = options.port ?? DEFAULT_PORT;
  let contextPromise: Promise<StudioContext> | undefined = options.context
    ? Promise.resolve(options.context)
    : undefined;

  if (host === "0.0.0.0") {
    console.warn(
      "[AgentInspect studio] Binding to 0.0.0.0 exposes workspace evidence on the network. Use 127.0.0.1 unless you accept that risk.",
    );
    if (options.auth !== "basic") {
      console.warn(
        "[AgentInspect studio] Non-localhost binding without --auth basic is discouraged for production use.",
      );
    }
  }

  const server = createServer(async (req, res) => {
    try {
      const method = req.method ?? "GET";
      const url = new URL(req.url ?? "/", `http://${host}:${port}`);
      const pathname = url.pathname;

      if (!contextPromise) {
        contextPromise = createStudioContext(options);
      }
      const ctx = await contextPromise;
      const httpConfig = resolveHttpIngestConfig(options, ctx.registry.ingest?.http);

      if (isHttpIngestRoute(pathname, httpConfig)) {
        const handled = await handleHttpIngestRequest(req, res, ctx, options, pathname);
        if (handled) return;
      }

      if (method !== "GET" && method !== "HEAD") {
        return badRequest(res, "Only GET is supported.");
      }

      if (pathname === "/" || pathname === "/index.html") {
        if (req.method === "HEAD") {
          res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
          res.end();
          return;
        }
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        res.end(studioIndexHtml);
        return;
      }

      const handled = await handleStudioRoute(req, res, ctx, options, pathname, url);
      if (!handled) {
        res.writeHead(404, {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store",
        });
        res.end(JSON.stringify({ error: `Unknown route: ${pathname}` }));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.writeHead(500, {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      });
      res.end(JSON.stringify({ error: message }));
    }
  });

  return server;
}

export async function startStudioServer(
  options: StudioServerOptions = {},
): Promise<StudioServerInfo> {
  const host = resolveHost(options);
  const port = options.port ?? DEFAULT_PORT;
  const ctx = options.context ?? (await createStudioContext(options));
  const server = createStudioServer({ ...options, context: ctx });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      const address = server.address();
      const resolvedPort =
        typeof address === "object" && address ? address.port : port;
      resolve({
        host,
        port: resolvedPort,
        url: `http://${host === "0.0.0.0" ? "127.0.0.1" : host}:${resolvedPort}/`,
        mode: "studio",
        ...(options.workspacePath !== undefined
          ? { workspacePath: options.workspacePath }
          : {}),
        dbPath: ctx.dbPath,
        registryName: ctx.registry.name,
        projectCount: ctx.projects.length,
      });
    });
  });
}
