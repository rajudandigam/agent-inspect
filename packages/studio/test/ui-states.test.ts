import http from "node:http";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createStudioContext, createStudioServer } from "../src/index.js";
import { studioIndexHtml } from "../src/html.js";

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
 * Studio empty-state, load-error, and accessibility coverage (#111).
 * Static assertions pin the shell the browser receives; server assertions
 * pin the API responses the client renders for no-data and error states.
 * No browser E2E; preview UI, synthetic data only.
 */
describe("studio shell accessibility and states", () => {
  it("declares language, charset, title, and a CSP", () => {
    expect(studioIndexHtml).toContain('<html lang="en">');
    expect(studioIndexHtml).toContain('<meta charset="utf-8" />');
    expect(studioIndexHtml).toContain("<title>AgentInspect Studio</title>");
    expect(studioIndexHtml).toContain("Content-Security-Policy");
  });

  it("keeps keyboard-reachable navigation: every nav entry is a real link", () => {
    const nav = studioIndexHtml.match(/<nav id="nav">([\s\S]*?)<\/nav>/)?.[1] ?? "";
    const anchors = [...nav.matchAll(/<a\s+([^>]+)>/g)].map((m) => m[1]!);
    expect(anchors.length).toBeGreaterThanOrEqual(7);
    for (const attrs of anchors) {
      // href makes the entry focusable and Enter-activatable by default;
      // no tabindex removal or click-only div navigation.
      expect(attrs).toMatch(/href="#/);
      expect(attrs).not.toContain("tabindex=\"-1\"");
    }
    expect(studioIndexHtml).not.toContain("onclick=");
  });

  it("uses landmark structure and a visible loading state", () => {
    expect(studioIndexHtml).toContain("<header>");
    expect(studioIndexHtml).toContain('<main id="content">');
    expect(studioIndexHtml).toContain("Loading…");
  });

  it("ships the no-data onboarding row and error affordance in the client", () => {
    expect(studioIndexHtml).toContain("No projects imported");
    expect(studioIndexHtml).toContain('class="error"');
    // Every dynamic interpolation goes through the client-side escaper.
    expect(studioIndexHtml).toContain("function escapeHtml(");
  });

  describe("no-data project server states", () => {
    let server: http.Server | undefined;
    let baseUrl: string;

    beforeEach(async () => {
      // The registry schema requires at least one project, so the no-data
      // onboarding state is a workspace project whose trace directory has no
      // runs yet.
      const tmpDir = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-studio-empty-"));
      const workspaceDir = path.join(tmpDir, "empty-project", ".agent-inspect");
      await mkdir(path.join(workspaceDir, "runs"), { recursive: true });
      await writeFile(
        path.join(workspaceDir, "workspace.json"),
        `${JSON.stringify(
          {
            schemaVersion: "1.0",
            project: "empty",
            createdAt: "2026-07-09T00:00:00.000Z",
            traceDirs: ["runs"],
            reportsDir: "reports",
            artifactsDir: "artifacts",
            bundlesDir: "bundles",
            notesDir: "notes",
            redactionProfile: "share",
            index: { enabled: false, type: "none" },
          },
          null,
          2,
        )}\n`,
        "utf-8",
      );
      const registryPath = path.join(tmpDir, "studio-registry.json");
      await writeFile(
        registryPath,
        `${JSON.stringify(
          {
            schemaVersion: "1.0",
            name: "empty-fixture",
            projects: [{ id: "empty", path: "empty-project", label: "Empty Project" }],
          },
          null,
          2,
        )}\n`,
        "utf-8",
      );
      const context = await createStudioContext({
        workspacePath: registryPath,
        dbPath: path.join(tmpDir, "studio.db"),
        cwd: tmpDir,
      });
      server = createStudioServer({ context, port: 0 });
      await new Promise<void>((resolve) => server!.listen(0, "127.0.0.1", () => resolve()));
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      baseUrl = `http://127.0.0.1:${port}`;
    });

    afterEach(async () => {
      if (!server) return;
      await new Promise<void>((resolve, reject) => {
        server!.close((error) => (error ? reject(error) : resolve()));
      });
    });

    it("serves the shell and a zero-run project without errors", async () => {
      const shell = await get(baseUrl, "/");
      expect(shell.status).toBe(200);
      expect(shell.text).toContain("AgentInspect Studio");

      const projects = await get(baseUrl, "/api/projects");
      expect(projects.status).toBe(200);
      const body = JSON.parse(projects.text) as {
        projects: Array<{ id: string; traceCount: number }>;
      };
      expect(body.projects).toHaveLength(1);
      expect(body.projects[0]).toMatchObject({ id: "empty", traceCount: 0 });

      const runs = await get(baseUrl, "/api/projects/empty/runs");
      expect(runs.status).toBe(200);
      expect(JSON.parse(runs.text)).toMatchObject({ runs: [] });

      const health = await get(baseUrl, "/api/health");
      expect(health.status).toBe(200);
    });

    it("returns a safe JSON error for an unknown project instead of crashing", async () => {
      const missing = await get(baseUrl, "/api/projects/does-not-exist/runs");
      expect(missing.status).toBeGreaterThanOrEqual(400);
      expect(missing.status).toBeLessThan(500);
      const body = JSON.parse(missing.text) as { error?: string };
      expect(typeof body.error).toBe("string");
      expect(body.error!.length).toBeGreaterThan(0);
    });
  });
});
