import http from "node:http";
import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createStudioContext, createStudioServer } from "../src/index.js";

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

describe("@agent-inspect/studio", () => {
  const repoRoot = path.resolve(import.meta.dirname, "../../..");
  const fixtureRoot = path.join(repoRoot, "fixtures/studio");
  let server: http.Server;
  let baseUrl: string;

  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-studio-index-"));
    const context = await createStudioContext({
      workspacePath: path.join(fixtureRoot, "studio-registry.json"),
      dbPath: path.join(tmpDir, "studio.db"),
      cwd: fixtureRoot,
    });
    server = createStudioServer({ context, port: 0 });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterEach(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  it("serves health read-only on localhost", async () => {
    const health = await getJson(baseUrl, "/api/health");
    expect(health.status).toBe(200);
    expect(health.body).toMatchObject({
      ok: true,
      readOnly: true,
      mode: "studio",
    });
    expect((health.body as { projects: unknown[] }).projects.length).toBeGreaterThan(0);
  });

  it("serves index html and rejects POST", async () => {
    const html = await new Promise<string>((resolve, reject) => {
      http.get(`${baseUrl}/`, (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk as Buffer));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      }).on("error", reject);
    });
    expect(html).toContain("AgentInspect Studio");

    const postStatus = await new Promise<number>((resolve, reject) => {
      const req = http.request(`${baseUrl}/api/health`, { method: "POST" }, (res) => {
        res.resume();
        res.on("end", () => resolve(res.statusCode ?? 0));
      });
      req.on("error", reject);
      req.end("x");
    });
    expect(postStatus).toBe(400);
  });
});
