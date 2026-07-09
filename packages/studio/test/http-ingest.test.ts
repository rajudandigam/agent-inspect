import http from "node:http";
import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createStudioContext, createStudioServer } from "../src/index.js";
import {
  HTTP_INGEST_ARTIFACT_PATH,
  HTTP_INGEST_BUNDLE_PATH,
} from "../src/ingest/http.js";
import {
  extractIngestTokenFromRequest,
  isIngestTokenValid,
} from "../src/ingest/token.js";

async function request(
  baseUrl: string,
  route: string,
  options: { method?: string; headers?: Record<string, string>; body?: string } = {},
): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      `${baseUrl}${route}`,
      {
        method: options.method ?? "GET",
        headers: options.headers,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk as Buffer));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          resolve({
            status: res.statusCode ?? 0,
            body: text.length > 0 ? JSON.parse(text) : null,
          });
        });
      },
    );
    req.on("error", reject);
    if (options.body !== undefined) req.end(options.body);
    else req.end();
  });
}

describe("studio HTTP ingest", () => {
  let tmpDir: string;
  let server: http.Server;
  let baseUrl: string;
  let previousToken: string | undefined;

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-http-ingest-"));
    const registryDir = path.join(tmpDir, "registry");
    const fs = await import("node:fs/promises");
    await fs.mkdir(path.join(registryDir, "imports/bundles"), { recursive: true });
    await fs.mkdir(path.join(registryDir, "imports/ci"), { recursive: true });

    const demoProject = path.join(registryDir, "demo-project");
    await fs.mkdir(path.join(demoProject, ".agent-inspect/runs"), { recursive: true });
    await fs.writeFile(
      path.join(demoProject, ".agent-inspect/workspace.json"),
      JSON.stringify({
        schemaVersion: "1.0",
        project: "demo",
        traceDirs: ["runs"],
        redactionProfile: "local",
      }),
      "utf8",
    );
    await fs.writeFile(
      path.join(demoProject, ".agent-inspect/runs/sample.jsonl"),
      '{"schemaVersion":"0.1","type":"run_start","runId":"run-1","timestamp":1}\n',
      "utf8",
    );

    await fs.writeFile(
      path.join(registryDir, "studio-registry.json"),
      JSON.stringify({
        schemaVersion: "1.0",
        name: "http-ingest-fixture",
        projects: [{ id: "demo", path: "demo-project" }],
        import: { bundlesDir: "imports/bundles", ciArtifactsDir: "imports/ci" },
        ingest: { http: { enabled: false, tokenEnv: "STUDIO_INGEST_TOKEN" } },
      }),
      "utf8",
    );

    previousToken = process.env.STUDIO_INGEST_TOKEN;
    process.env.STUDIO_INGEST_TOKEN = "ingest-secret-token";

    const context = await createStudioContext({
      workspacePath: path.join(registryDir, "studio-registry.json"),
      dbPath: path.join(tmpDir, "studio.db"),
      cwd: registryDir,
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
    if (previousToken === undefined) delete process.env.STUDIO_INGEST_TOKEN;
    else process.env.STUDIO_INGEST_TOKEN = previousToken;
  });

  it("returns 404 when HTTP ingest is disabled", async () => {
    const response = await request(baseUrl, HTTP_INGEST_BUNDLE_PATH, {
      method: "POST",
      headers: {
        Authorization: "Bearer ingest-secret-token",
        "content-type": "application/octet-stream",
      },
      body: "bundle-bytes",
    });
    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({ error: "HTTP ingest is disabled" });
  });

  it("validates ingest tokens with constant-time compare helper", () => {
    expect(
      isIngestTokenValid(
        "secret",
        extractIngestTokenFromRequest({
          authorization: "Bearer secret",
        }),
      ),
    ).toBe(true);
    expect(isIngestTokenValid("wrong", "secret")).toBe(false);
  });
});

describe("studio HTTP ingest enabled", () => {
  let tmpDir: string;
  let server: http.Server;
  let baseUrl: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-http-ingest-on-"));
    const registryDir = path.join(tmpDir, "registry");
    await import("node:fs/promises").then(async (fs) => {
      await fs.mkdir(path.join(registryDir, "imports/bundles"), { recursive: true });
      await fs.mkdir(path.join(registryDir, "imports/ci"), { recursive: true });
      const demoProject = path.join(registryDir, "demo-project");
      await fs.mkdir(path.join(demoProject, ".agent-inspect/runs"), { recursive: true });
      await fs.writeFile(
        path.join(demoProject, ".agent-inspect/workspace.json"),
        JSON.stringify({
          schemaVersion: "1.0",
          project: "demo",
          traceDirs: ["runs"],
          redactionProfile: "local",
        }),
        "utf8",
      );
      await fs.writeFile(
        path.join(demoProject, ".agent-inspect/runs/sample.jsonl"),
        '{"schemaVersion":"0.1","type":"run_start","runId":"run-1","timestamp":1}\n',
        "utf8",
      );
      await fs.writeFile(
        path.join(registryDir, "studio-registry.json"),
        JSON.stringify({
          schemaVersion: "1.0",
          name: "http-ingest-on",
          projects: [{ id: "demo", path: "demo-project" }],
          import: { bundlesDir: "imports/bundles", ciArtifactsDir: "imports/ci" },
        }),
        "utf8",
      );
    });

    process.env.STUDIO_INGEST_TOKEN = "ingest-secret-token";
    const context = await createStudioContext({
      workspacePath: path.join(registryDir, "studio-registry.json"),
      dbPath: path.join(tmpDir, "studio.db"),
      cwd: registryDir,
    });
    server = createStudioServer({ context, port: 0, ingestHttp: true });
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

  it("rejects missing token and accepts valid bundle upload", async () => {
    const denied = await request(baseUrl, HTTP_INGEST_BUNDLE_PATH, {
      method: "POST",
      body: "bundle",
    });
    expect(denied.status).toBe(403);

    const accepted = await request(baseUrl, HTTP_INGEST_BUNDLE_PATH, {
      method: "POST",
      headers: {
        Authorization: "Bearer ingest-secret-token",
        "content-type": "application/octet-stream",
      },
      body: "bundle-bytes",
    });
    expect(accepted.status).toBe(200);
    expect(accepted.body).toMatchObject({ ok: true, imported: true, kind: "bundle" });

    const artifact = await request(baseUrl, HTTP_INGEST_ARTIFACT_PATH, {
      method: "POST",
      headers: { "X-AgentInspect-Token": "ingest-secret-token" },
      body: "zip-bytes",
    });
    expect(artifact.status).toBe(200);
    expect(artifact.body).toMatchObject({ kind: "artifact" });
  });
});
