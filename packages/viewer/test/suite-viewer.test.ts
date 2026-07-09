import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import http from "node:http";

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

describe("suite viewer", () => {
  let server: http.Server;
  let baseUrl: string;
  const repoRoot = path.resolve(import.meta.dirname, "../../..");

  beforeEach(async () => {
    server = createViewerServer({
      mode: "suite",
      suiteConfigPath: path.join(repoRoot, "fixtures/configs/outcome-suite.suite.json"),
      cwd: repoRoot,
      port: 0,
    });
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

  it("loads suite fixture with case status and observations", async () => {
    const health = await getJson(baseUrl, "/api/health");
    expect((health.body as { mode: string }).mode).toBe("suite");

    const suite = await getJson(baseUrl, "/api/suite");
    expect(suite.status).toBe(200);
    const data = suite.body as {
      suiteName: string;
      cases: Array<{ id: string; observations: Array<{ name: string }> }>;
    };
    expect(data.suiteName).toBe("outcome-suite");
    expect(data.cases.some((item) => item.observations.some((o) => o.name === "policyShown"))).toBe(
      true,
    );
  });
});
