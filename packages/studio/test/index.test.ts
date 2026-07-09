import http from "node:http";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createStudioServer } from "../src/index.js";

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
  let server: http.Server;
  let baseUrl: string;

  beforeEach(async () => {
    server = createStudioServer({ port: 0 });
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
      projects: [],
    });
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
