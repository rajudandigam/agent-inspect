import http from "node:http";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createStudioServer } from "../src/index.js";
import { resolveHttpIngestConfig } from "../src/ingest/http.js";

const TOKEN_ENV = "STUDIO_INGEST_CONFIG_TEST_TOKEN";

async function post(
  baseUrl: string,
  route: string,
  body: string,
  headers: Record<string, string> = {},
): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      `${baseUrl}${route}`,
      { method: "POST", headers },
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
    req.end(body);
  });
}

/**
 * Registry-configured HTTP ingest settings must apply on the lazy-context
 * path too: createStudioServer without options.context previously fell back
 * to the default tokenEnv/path/maxBytes because the resolver read
 * options.context instead of the resolved registry.
 */
describe("studio HTTP ingest config resolution", () => {
  it("prefers the resolved registry config over options.context", () => {
    const config = resolveHttpIngestConfig(
      {},
      { enabled: true, path: "/custom/ingest", tokenEnv: "MY_INGEST_TOKEN", maxBytes: 1234 },
    );
    expect(config).toEqual({
      enabled: true,
      basePath: "/custom/ingest",
      tokenEnv: "MY_INGEST_TOKEN",
      maxBytes: 1234,
    });
  });

  it("falls back to defaults when no registry config is provided", () => {
    const config = resolveHttpIngestConfig({});
    expect(config.enabled).toBe(false);
    expect(config.basePath).toBe("/api/ingest");
    expect(config.tokenEnv).toBe("STUDIO_INGEST_TOKEN");
    expect(config.maxBytes).toBe(52_428_800);
  });

  describe("lazy-context server honors registry tokenEnv and maxBytes", () => {
    let server: http.Server | undefined;
    let baseUrl: string;
    let previousToken: string | undefined;

    beforeEach(async () => {
      previousToken = process.env[TOKEN_ENV];
      process.env[TOKEN_ENV] = "fixture-ingest-token";

      const tmpDir = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-ingest-config-"));
      const workspaceDir = path.join(tmpDir, "demo-project", ".agent-inspect");
      await mkdir(path.join(workspaceDir, "runs"), { recursive: true });
      await mkdir(path.join(tmpDir, "imports", "bundles"), { recursive: true });
      await mkdir(path.join(tmpDir, "imports", "ci"), { recursive: true });
      await writeFile(
        path.join(workspaceDir, "workspace.json"),
        `${JSON.stringify({
          schemaVersion: "1.0",
          project: "demo",
          createdAt: "2026-07-09T00:00:00.000Z",
          traceDirs: ["runs"],
          reportsDir: "reports",
          artifactsDir: "artifacts",
          bundlesDir: "bundles",
          notesDir: "notes",
          redactionProfile: "share",
          index: { enabled: false, type: "none" },
        })}\n`,
        "utf-8",
      );
      await writeFile(
        path.join(tmpDir, "studio-registry.json"),
        `${JSON.stringify({
          schemaVersion: "1.0",
          name: "ingest-config-fixture",
          projects: [{ id: "demo", path: "demo-project" }],
          import: { bundlesDir: "imports/bundles", ciArtifactsDir: "imports/ci" },
          ingest: { http: { enabled: true, tokenEnv: TOKEN_ENV, maxBytes: 64 } },
        })}\n`,
        "utf-8",
      );

      // Lazy-context path on purpose: no options.context.
      server = createStudioServer({
        workspacePath: path.join(tmpDir, "studio-registry.json"),
        dbPath: path.join(tmpDir, "studio.db"),
        cwd: tmpDir,
        port: 0,
      });
      await new Promise<void>((resolve) => server!.listen(0, "127.0.0.1", () => resolve()));
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      baseUrl = `http://127.0.0.1:${port}`;
    });

    afterEach(async () => {
      if (previousToken === undefined) delete process.env[TOKEN_ENV];
      else process.env[TOKEN_ENV] = previousToken;
      if (!server) return;
      await new Promise<void>((resolve, reject) => {
        server!.close((error) => (error ? reject(error) : resolve()));
      });
    });

    it("accepts the registry-configured token instead of the default env", async () => {
      const response = await post(baseUrl, "/api/ingest/artifact", "small-body", {
        authorization: "Bearer fixture-ingest-token",
        "content-type": "application/octet-stream",
      });
      // Anything but 403 proves the token from the registry env was used;
      // the payload itself may still be rejected downstream.
      expect(response.status).not.toBe(403);
    });

    it("rejects tokens that only match the default env", async () => {
      const previousDefault = process.env.STUDIO_INGEST_TOKEN;
      process.env.STUDIO_INGEST_TOKEN = "default-env-token";
      try {
        const response = await post(baseUrl, "/api/ingest/artifact", "small-body", {
          authorization: "Bearer default-env-token",
          "content-type": "application/octet-stream",
        });
        expect(response.status).toBe(403);
      } finally {
        if (previousDefault === undefined) delete process.env.STUDIO_INGEST_TOKEN;
        else process.env.STUDIO_INGEST_TOKEN = previousDefault;
      }
    });

    it("enforces the registry-configured maxBytes", async () => {
      const oversized = "A".repeat(200);
      const response = await post(baseUrl, "/api/ingest/artifact", oversized, {
        authorization: "Bearer fixture-ingest-token",
        "content-type": "application/octet-stream",
      });
      expect(response.status).toBe(413);
    });
  });
});
