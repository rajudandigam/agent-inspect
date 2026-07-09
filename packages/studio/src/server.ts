import { createServer, type Server, type ServerResponse } from "node:http";

import { studioIndexHtml } from "./html.js";
import type { StudioServerInfo, StudioServerOptions } from "./types.js";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 7340;

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(payload);
}

function badRequest(res: ServerResponse, message: string): void {
  sendJson(res, 400, { error: message });
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

  if (host === "0.0.0.0") {
    console.warn(
      "[AgentInspect studio] Binding to 0.0.0.0 exposes workspace evidence on the network. Use 127.0.0.1 unless you accept that risk.",
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
        if (req.method === "HEAD") {
          res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
          res.end();
          return;
        }
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        res.end(studioIndexHtml);
        return;
      }

      if (pathname === "/api/health") {
        if (req.method === "HEAD") {
          res.writeHead(200);
          res.end();
          return;
        }
        return sendJson(res, 200, {
          ok: true,
          readOnly: true,
          mode: "studio",
          ...(options.workspacePath !== undefined
            ? { workspacePath: options.workspacePath }
            : {}),
          ...(options.dbPath !== undefined ? { dbPath: options.dbPath } : {}),
          projects: [],
        });
      }

      sendJson(res, 404, { error: `Unknown route: ${pathname}` });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      sendJson(res, 500, { error: message });
    }
  });

  return server;
}

export function startStudioServer(
  options: StudioServerOptions = {},
): Promise<StudioServerInfo> {
  const host = resolveHost(options);
  const port = options.port ?? DEFAULT_PORT;
  const server = createStudioServer(options);

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
        ...(options.dbPath !== undefined ? { dbPath: options.dbPath } : {}),
      });
    });
  });
}
