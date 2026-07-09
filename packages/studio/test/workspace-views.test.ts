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

describe("@agent-inspect/studio workspace views", () => {
  const repoRoot = path.resolve(import.meta.dirname, "../../..");
  const fixtureRoot = path.join(repoRoot, "fixtures/studio");
  let server: http.Server;
  let baseUrl: string;

  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-studio-views-"));
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

  it("loads projects, runs, sessions, suites, and checks", async () => {
    const health = await getJson(baseUrl, "/api/health");
    expect(health.status).toBe(200);
    expect((health.body as { projects: Array<{ id: string }> }).projects[0]?.id).toBe("demo");

    const projects = await getJson(baseUrl, "/api/projects");
    expect((projects.body as { projects: Array<{ traceCount: number }> }).projects[0]?.traceCount).toBeGreaterThan(0);

    const runs = await getJson(baseUrl, "/api/projects/demo/runs");
    expect((runs.body as { runs: Array<{ runId: string }> }).runs.length).toBeGreaterThan(0);

    const sessions = await getJson(baseUrl, "/api/projects/demo/sessions");
    expect((sessions.body as { sessions: unknown[] }).sessions).toBeDefined();

    const suites = await getJson(baseUrl, "/api/projects/demo/suites");
    expect((suites.body as { suites: Array<{ suiteName: string }> }).suites.length).toBeGreaterThan(0);

    const checks = await getJson(baseUrl, "/api/projects/demo/checks");
    expect((checks.body as { checks: unknown[] }).checks.length).toBeGreaterThan(0);
  });

  it("supports search, diff, reports, observations, guardrails, redaction, and bundle export", async () => {
    const runs = await getJson(baseUrl, "/api/projects/demo/runs");
    const runIds = (runs.body as { runs: Array<{ runId: string }> }).runs.map((run) => run.runId);
    expect(runIds.length).toBeGreaterThan(0);

    const search = await getJson(baseUrl, `/api/search?projectId=demo&q=${encodeURIComponent(runIds[0]!)}`);
    expect(search.status).toBe(200);

    if (runIds.length >= 2) {
      const diff = await getJson(
        baseUrl,
        `/api/diff?projectId=demo&left=${encodeURIComponent(runIds[0]!)}&right=${encodeURIComponent(runIds[1]!)}`,
      );
      expect(diff.status).toBe(200);
    }

    const reports = await getJson(baseUrl, "/api/reports?projectId=demo");
    expect(reports.status).toBe(200);

    const observations = await getJson(baseUrl, "/api/projects/demo/observations");
    expect(observations.status).toBe(200);

    const guardrails = await getJson(baseUrl, "/api/projects/demo/guardrails");
    expect(guardrails.status).toBe(200);

    const redaction = await getJson(baseUrl, "/api/projects/demo/redaction");
    expect((redaction.body as { redaction: { profile: string } }).redaction.profile).toBe("share");

    const bundle = await getJson(
      baseUrl,
      `/api/bundles/export?projectId=demo&runId=${encodeURIComponent(runIds[0]!)}`,
    );
    expect((bundle.body as { readOnly: boolean }).readOnly).toBe(true);
  });
});
