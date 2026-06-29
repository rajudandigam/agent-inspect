import { mkdtemp, rm } from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { inspectRun } from "agent-inspect";

import { createViewerServer } from "../src/index.js";

async function getJson(baseUrl: string, route: string): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    http.get(`${baseUrl}${route}`, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk) => chunks.push(chunk as Buffer));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        resolve({
          status: res.statusCode ?? 0,
          body: text.length > 0 ? JSON.parse(text) : null,
        });
      });
    }).on("error", reject);
  });
}

describe("@agent-inspect/viewer", () => {
  let traceDir: string;
  let server: http.Server;
  let baseUrl: string;

  beforeEach(async () => {
    traceDir = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-viewer-"));
    process.env.AGENT_INSPECT_TRACE_DIR = traceDir;
    await inspectRun("viewer-run", async () => {}, { traceDir });
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
    delete process.env.AGENT_INSPECT_TRACE_DIR;
    await rm(traceDir, { recursive: true, force: true });
  });

  it("serves health and trace list read-only", async () => {
    const health = await getJson(baseUrl, "/api/health");
    expect(health.status).toBe(200);
    expect((health.body as { readOnly: boolean }).readOnly).toBe(true);

    const traces = await getJson(baseUrl, "/api/traces");
    expect(traces.status).toBe(200);
    expect(Array.isArray(traces.body)).toBe(true);
    expect((traces.body as Array<{ runId: string }>).length).toBeGreaterThan(0);
  });

  it("returns trace detail and rejects POST", async () => {
    const traces = await getJson(baseUrl, "/api/traces");
    const runId = (traces.body as Array<{ runId: string }>)[0]!.runId;
    const detail = await getJson(baseUrl, `/api/trace/${encodeURIComponent(runId)}`);
    expect(detail.status).toBe(200);
    expect((detail.body as { runId: string }).runId).toBe(runId);

    const postStatus = await new Promise<number>((resolve, reject) => {
      const req = http.request(`${baseUrl}/api/traces`, { method: "POST" }, (res) => {
        res.resume();
        res.on("end", () => resolve(res.statusCode ?? 0));
      });
      req.on("error", reject);
      req.end("x");
    });
    expect(postStatus).toBe(400);
  });

  it("serves index html", async () => {
    const html = await new Promise<string>((resolve, reject) => {
      http.get(`${baseUrl}/`, (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk as Buffer));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      }).on("error", reject);
    });
    expect(html).toContain("AgentInspect local viewer");
  });
});
