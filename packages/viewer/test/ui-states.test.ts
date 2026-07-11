import http from "node:http";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createViewerServer } from "../src/index.js";
import { viewerIndexHtml } from "../src/html.js";

async function get(baseUrl: string, route: string) {
  return new Promise<{ status: number; text: string }>((resolve, reject) => {
    http.get(`${baseUrl}${route}`, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk) => chunks.push(chunk as Buffer));
      res.on("end", () =>
        resolve({ status: res.statusCode ?? 0, text: Buffer.concat(chunks).toString("utf8") }),
      );
    }).on("error", reject);
  });
}

/**
 * Viewer empty-state, load-error, and accessibility coverage (#111).
 * Preview UI; static shell assertions plus server behavior over an empty
 * trace directory. Synthetic data only, no browser E2E.
 */
describe("viewer shell accessibility and states", () => {
  it("declares language, charset, title, and a visible loading state", () => {
    expect(viewerIndexHtml).toContain('<html lang="en">');
    expect(viewerIndexHtml).toContain('<meta charset="utf-8" />');
    expect(viewerIndexHtml).toContain("<title>AgentInspect Viewer</title>");
    expect(viewerIndexHtml).toContain("Loading…");
  });

  it("keeps navigation as real links and routes errors to visible text", () => {
    // API navigation is emitted as anchors (focusable/Enter-activatable).
    expect(viewerIndexHtml).toContain("'<a href=\"/api/traces\">/api/traces</a>");
    // Load failures land in the output element as text, never thrown away.
    expect(viewerIndexHtml).toMatch(/load\(\)\.catch\(/);
    expect(viewerIndexHtml).toContain("function escapeHtml(");
  });

  describe("empty trace directory", () => {
    let traceDir: string;
    let server: http.Server;
    let baseUrl: string;

    beforeEach(async () => {
      traceDir = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-viewer-empty-"));
      server = createViewerServer({ traceDir, port: 0 });
      await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      baseUrl = `http://127.0.0.1:${port}`;
    });

    afterEach(async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
      await rm(traceDir, { recursive: true, force: true });
    });

    it("serves the shell and an empty trace list without errors", async () => {
      const shell = await get(baseUrl, "/");
      expect(shell.status).toBe(200);
      expect(shell.text).toContain("AgentInspect local viewer");

      const traces = await get(baseUrl, "/api/traces");
      expect(traces.status).toBe(200);
      expect(JSON.parse(traces.text)).toEqual([]);
    });

    it("returns a safe non-2xx JSON error for an unknown run", async () => {
      const missing = await get(baseUrl, "/api/trace/does-not-exist");
      expect(missing.status).toBeGreaterThanOrEqual(400);
      expect(missing.status).toBeLessThan(500);
      const body = JSON.parse(missing.text) as { error?: string };
      expect(typeof body.error).toBe("string");
    });
  });
});
