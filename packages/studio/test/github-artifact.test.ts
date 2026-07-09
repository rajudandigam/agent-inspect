import { readFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { openStudioDb } from "../src/db.js";
import {
  importGitHubArtifact,
  type StudioFetch,
} from "../src/ingest/github-artifact.js";
import { parseStudioRegistry } from "../src/registry.js";

describe("studio github artifact importer", () => {
  const repoRoot = path.resolve(import.meta.dirname, "../../..");
  const fixtureRoot = path.join(repoRoot, "fixtures/studio");
  const artifactFixture = path.join(fixtureRoot, "github-artifact/sample-artifact.zip");
  let tmpDir: string;
  let dbPath: string;
  let registryPath: string;
  let registryDir: string;
  let previousToken: string | undefined;

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-github-import-"));
    registryDir = path.join(tmpDir, "registry");
    await import("node:fs/promises").then((fs) =>
      fs.mkdir(path.join(registryDir, "imports", "bundles"), { recursive: true }),
    );

    const demoProject = path.join(registryDir, "demo-project");
    await import("node:fs/promises").then(async (fs) => {
      await fs.mkdir(path.join(demoProject, ".agent-inspect", "runs"), { recursive: true });
      await fs.writeFile(
        path.join(demoProject, ".agent-inspect", "workspace.json"),
        JSON.stringify({
          schemaVersion: "1.0",
          project: "demo",
          traceDirs: ["runs"],
          redactionProfile: "local",
        }),
        "utf8",
      );
      await fs.writeFile(
        path.join(demoProject, ".agent-inspect", "runs", "sample.jsonl"),
        '{"schemaVersion":"0.1","type":"run_start","runId":"run-1","timestamp":1}\n',
        "utf8",
      );
    });

    registryPath = path.join(registryDir, "studio-registry.json");
    await import("node:fs/promises").then((fs) =>
      fs.writeFile(
        registryPath,
        JSON.stringify({
          schemaVersion: "1.0",
          name: "github-import-fixture",
          projects: [{ id: "demo", path: "demo-project" }],
          import: {
            bundlesDir: "imports/bundles",
          },
          ingest: {
            github: {
              enabled: false,
              tokenEnv: "GITHUB_TOKEN",
            },
          },
        }),
        "utf8",
      ),
    );

    dbPath = path.join(tmpDir, "studio.db");
    previousToken = process.env.GITHUB_TOKEN;
    process.env.GITHUB_TOKEN = "test-token-secret-value";
  });

  afterEach(() => {
    if (previousToken === undefined) {
      delete process.env.GITHUB_TOKEN;
    } else {
      process.env.GITHUB_TOKEN = previousToken;
    }
    vi.restoreAllMocks();
  });

  function mockFetch(zip: Buffer): StudioFetch {
    return async (url) => {
      const href = String(url);
      if (href.includes("/actions/runs/") && href.endsWith("/artifacts")) {
        return new Response(
          JSON.stringify({
            artifacts: [
              {
                id: 42,
                name: "ci-artifacts",
                archive_download_url: "https://example.test/download/ci-artifacts.zip",
                size_in_bytes: zip.length,
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
      if (href.includes("example.test/download")) {
        return new Response(zip, { status: 200 });
      }
      return new Response("not found", { status: 404 });
    };
  }

  it("skips when ingest is not explicitly enabled", async () => {
    const parsed = parseStudioRegistry(
      JSON.parse(await readFile(registryPath, "utf8")) as unknown,
    );
    const db = openStudioDb(dbPath);
    const result = await importGitHubArtifact({
      db,
      registryPath,
      registry: parsed.registry!,
      repo: "acme/demo",
      runId: "123",
      artifactName: "ci-artifacts",
      enabled: false,
    });
    expect(result.skipped).toBe(true);
    expect(result.imported).toBe(false);
  });

  it("imports artifact bytes with mocked fetch and is idempotent", async () => {
    const parsed = parseStudioRegistry(
      JSON.parse(await readFile(registryPath, "utf8")) as unknown,
    );
    const zip = await readFile(artifactFixture);
    const db = openStudioDb(dbPath);

    const first = await importGitHubArtifact({
      db,
      registryPath,
      registry: parsed.registry!,
      repo: "acme/demo",
      runId: "123",
      artifactName: "ci-artifacts",
      enabled: true,
      fetchImpl: mockFetch(zip),
    });
    expect(first.imported).toBe(true);
    expect(first.destPath).toBeDefined();
    await expect(readFile(first.destPath!, undefined)).resolves.toBeDefined();

    const second = await importGitHubArtifact({
      db,
      registryPath,
      registry: parsed.registry!,
      repo: "acme/demo",
      runId: "123",
      artifactName: "ci-artifacts",
      enabled: true,
      fetchImpl: mockFetch(zip),
    });
    expect(second.imported).toBe(false);
    expect(second.destPath).toBe(first.destPath);
  });

  it("returns safe errors when token is missing", async () => {
    delete process.env.GITHUB_TOKEN;
    const parsed = parseStudioRegistry(
      JSON.parse(await readFile(registryPath, "utf8")) as unknown,
    );
    const db = openStudioDb(dbPath);
    const result = await importGitHubArtifact({
      db,
      registryPath,
      registry: parsed.registry!,
      repo: "acme/demo",
      runId: "123",
      artifactName: "ci-artifacts",
      enabled: true,
      fetchImpl: mockFetch(Buffer.from("zip")),
    });
    expect(result.errors[0]).toContain("missing GitHub token");
    expect(result.errors.join(" ")).not.toContain("test-token");
  });

  it("rejects invalid repo format", async () => {
    const parsed = parseStudioRegistry(
      JSON.parse(await readFile(registryPath, "utf8")) as unknown,
    );
    const db = openStudioDb(dbPath);
    const result = await importGitHubArtifact({
      db,
      registryPath,
      registry: parsed.registry!,
      repo: "https://github.com/acme/demo",
      runId: "123",
      artifactName: "ci-artifacts",
      enabled: true,
      fetchImpl: mockFetch(Buffer.from("zip")),
    });
    expect(result.errors[0]).toContain("owner/name");
  });

  it("parses ingest.github registry block and warns on unknown ingest keys", () => {
    const result = parseStudioRegistry({
      schemaVersion: "1.0",
      name: "team",
      projects: [{ id: "a", path: "./demo" }],
      ingest: {
        github: { enabled: false, tokenEnv: "GITHUB_TOKEN" },
        http: { enabled: false },
      },
    });
    expect(result.ok).toBe(true);
    expect(result.registry?.ingest?.github?.tokenEnv).toBe("GITHUB_TOKEN");
    expect(result.warnings.some((warning) => warning.includes("http"))).toBe(true);
  });
});
