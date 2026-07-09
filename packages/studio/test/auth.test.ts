import http from "node:http";
import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createStudioContext, createStudioServer } from "../src/index.js";

async function getJson(baseUrl: string, route: string, headers: Record<string, string> = {}) {
  return new Promise<{ status: number; body: unknown }>((resolve, reject) => {
    http.get(`${baseUrl}${route}`, { headers }, (res) => {
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

describe("studio auth", () => {
  const repoRoot = path.resolve(import.meta.dirname, "../../..");
  const fixtureRoot = path.join(repoRoot, "fixtures/studio");
  let server: http.Server;
  let baseUrl: string;
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-studio-auth-"));
    process.env.STUDIO_TEST_PASSWORD = "secret";
    const context = await createStudioContext({
      workspacePath: path.join(fixtureRoot, "studio-registry.json"),
      dbPath: path.join(tmpDir, "studio.db"),
      cwd: fixtureRoot,
    });
    server = createStudioServer({
      context,
      port: 0,
      auth: "basic",
      passwordEnv: "STUDIO_TEST_PASSWORD",
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterEach(async () => {
    delete process.env.STUDIO_TEST_PASSWORD;
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  it("rejects missing auth and accepts basic credentials", async () => {
    const denied = await getJson(baseUrl, "/api/health");
    expect(denied.status).toBe(401);

    const authHeader = `Basic ${Buffer.from(`studio:secret`).toString("base64")}`;
    const allowed = await getJson(baseUrl, "/api/health", { Authorization: authHeader });
    expect(allowed.status).toBe(200);
  });
});
