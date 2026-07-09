import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  FILE_DROP_ARCHIVE_DIR,
  importFileDrop,
  importFileDropFromRegistry,
} from "../src/ingest/file-drop.js";
import { findIngestFileBySourceKey, openStudioDb } from "../src/db.js";
import { parseStudioRegistry } from "../src/registry.js";

describe("studio file-drop importer", () => {
  let tmpDir: string;
  let dbPath: string;
  let registryPath: string;
  let registryDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-file-drop-"));
    registryDir = path.join(tmpDir, "registry");
    const dropDir = path.join(registryDir, "imports", "drop");
    const ciDir = path.join(registryDir, "imports", "ci");
    const bundlesDir = path.join(registryDir, "imports", "bundles");
    await mkdir(dropDir, { recursive: true });
    await mkdir(ciDir, { recursive: true });
    await mkdir(bundlesDir, { recursive: true });

    const demoProject = path.join(registryDir, "demo-project");
    await mkdir(path.join(demoProject, ".agent-inspect", "runs"), { recursive: true });
    await writeFile(
      path.join(demoProject, ".agent-inspect", "workspace.json"),
      JSON.stringify({
        schemaVersion: "1.0",
        project: "demo",
        traceDirs: ["runs"],
        redactionProfile: "local",
      }),
      "utf8",
    );
    await writeFile(
      path.join(demoProject, ".agent-inspect", "runs", "sample.jsonl"),
      '{"schemaVersion":"0.1","type":"run_start","runId":"run-1","timestamp":1}\n',
      "utf8",
    );

    registryPath = path.join(registryDir, "studio-registry.json");
    await writeFile(
      registryPath,
      JSON.stringify({
        schemaVersion: "1.0",
        name: "file-drop-fixture",
        projects: [{ id: "demo", path: "demo-project" }],
        import: {
          ciArtifactsDir: "imports/ci",
          bundlesDir: "imports/bundles",
          fileDropDir: "imports/drop",
          enabled: false,
        },
      }),
      "utf8",
    );

    dbPath = path.join(tmpDir, "studio.db");
  });

  afterEach(async () => {
    // temp dirs cleaned by OS
  });

  it("skips when ingest is not explicitly enabled", async () => {
    const parsed = parseStudioRegistry(
      JSON.parse(await readFile(registryPath, "utf8")) as unknown,
    );
    expect(parsed.ok).toBe(true);
    const db = openStudioDb(dbPath);
    const result = await importFileDrop({
      db,
      registryPath,
      registry: parsed.registry!,
      enabled: false,
    });
    expect(result.skipped).toBe(true);
    expect(result.imported).toBe(0);
  });

  it("imports jsonl and bundle files idempotently", async () => {
    const parsed = parseStudioRegistry(
      JSON.parse(await readFile(registryPath, "utf8")) as unknown,
    );
    const dropDir = path.join(registryDir, "imports", "drop");
    await writeFile(path.join(dropDir, "ci-run.jsonl"), "line\n", "utf8");
    await writeFile(path.join(dropDir, "bundle.tgz"), "bundle-bytes", "utf8");

    const db = openStudioDb(dbPath);
    const first = await importFileDropFromRegistry({
      db,
      registryPath,
      registry: parsed.registry!,
      enabled: true,
    });
    expect(first.skipped).toBe(false);
    expect(first.imported).toBe(2);
    expect(first.files.map((file) => file.kind).sort()).toEqual(["bundle", "ci"]);

    const second = await importFileDropFromRegistry({
      db,
      registryPath,
      registry: parsed.registry!,
      enabled: true,
    });
    expect(second.imported).toBe(0);
    expect(second.skippedFiles).toBe(2);
    expect(findIngestFileBySourceKey(db, "ci-run.jsonl")?.kind).toBe("ci");
  });

  it("rejects traversal in configured drop dir override", async () => {
    const parsed = parseStudioRegistry(
      JSON.parse(await readFile(registryPath, "utf8")) as unknown,
    );
    const db = openStudioDb(dbPath);
    const result = await importFileDrop({
      db,
      registryPath,
      registry: parsed.registry!,
      enabled: true,
      dropDir: "../../outside",
    });
    expect(result.errors.some((error) => error.includes("escapes"))).toBe(true);
  });

  it("can archive imported drop files without deleting evidence copies", async () => {
    const parsed = parseStudioRegistry(
      JSON.parse(await readFile(registryPath, "utf8")) as unknown,
    );
    const dropDir = path.join(registryDir, "imports", "drop");
    const source = path.join(dropDir, "ci-run.jsonl");
    await writeFile(source, "line\n", "utf8");

    const db = openStudioDb(dbPath);
    const result = await importFileDropFromRegistry({
      db,
      registryPath,
      registry: parsed.registry!,
      enabled: true,
      archiveAfterImport: true,
    });
    expect(result.imported).toBe(1);
    const archived = path.join(dropDir, FILE_DROP_ARCHIVE_DIR, "ci-run.jsonl");
    await expect(readFile(archived, "utf8")).resolves.toBe("line\n");
    const dest = result.files[0]!.destPath;
    await expect(readFile(dest, "utf8")).resolves.toBe("line\n");
  });

  it("parses fileDropDir in studio registry", () => {
    const result = parseStudioRegistry({
      schemaVersion: "1.0",
      name: "team",
      projects: [{ id: "a", path: "./demo" }],
      import: {
        fileDropDir: "imports/drop",
        enabled: false,
      },
    });
    expect(result.ok).toBe(true);
    expect(result.registry?.import?.fileDropDir).toBe("imports/drop");
    expect(result.registry?.import?.enabled).toBe(false);
  });
});
