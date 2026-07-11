import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { openStudioDb } from "../src/db.js";
import {
  importBundleUpload,
  validateBundleDirectory,
} from "../src/ingest/bundle-upload.js";
import { parseStudioRegistry } from "../src/registry.js";

describe("studio bundle upload importer", () => {
  it("validates bundle metadata.json", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "bundle-validate-"));
    expect(await validateBundleDirectory(dir)).toContain("bundle missing metadata.json");

    await writeFile(
      path.join(dir, "metadata.json"),
      JSON.stringify({
        agentInspectVersion: "6.0.0",
        runIds: ["run-1"],
        files: ["trace.jsonl"],
      }),
      "utf8",
    );
    expect(await validateBundleDirectory(dir)).toEqual([]);
  });

  it("imports a valid bundle directory idempotently", async () => {
    const tmp = await mkdtemp(path.join(os.tmpdir(), "bundle-import-"));
    const registryDir = path.join(tmp, "registry");
    const bundleSrc = path.join(tmp, "bundle-src");
    await mkdir(path.join(registryDir, "imports/bundles"), { recursive: true });
    await mkdir(bundleSrc, { recursive: true });
    await writeFile(
      path.join(bundleSrc, "metadata.json"),
      JSON.stringify({
        agentInspectVersion: "6.0.0",
        redactionProfile: "share",
        runIds: ["run-abc"],
        files: ["trace.jsonl", "summary.md"],
      }),
      "utf8",
    );
    await writeFile(path.join(bundleSrc, "summary.md"), "# summary", "utf8");

    const demoProject = path.join(registryDir, "demo-project");
    await mkdir(path.join(demoProject, ".agent-inspect/runs"), { recursive: true });
    await writeFile(
      path.join(demoProject, ".agent-inspect/workspace.json"),
      JSON.stringify({
        schemaVersion: "1.0",
        project: "demo",
        traceDirs: ["runs"],
        redactionProfile: "local",
      }),
      "utf8",
    );
    await writeFile(
      path.join(demoProject, ".agent-inspect/runs/sample.jsonl"),
      '{"schemaVersion":"0.1","type":"run_start","runId":"run-1","timestamp":1}\n',
      "utf8",
    );

    const registryPath = path.join(registryDir, "studio-registry.json");
    await writeFile(
      registryPath,
      JSON.stringify({
        schemaVersion: "1.0",
        name: "bundle-upload-fixture",
        projects: [{ id: "demo", path: "demo-project" }],
        import: { bundlesDir: "imports/bundles" },
      }),
      "utf8",
    );

    const parsed = parseStudioRegistry(
      JSON.parse(
        await import("node:fs/promises").then((fs) =>
          fs.readFile(registryPath, "utf8"),
        ),
      ) as unknown,
    );
    const db = openStudioDb(path.join(tmp, "studio.db"));
    const first = await importBundleUpload({
      db,
      registryPath,
      registry: parsed.registry!,
      bundlePath: bundleSrc,
      enabled: true,
    });
    expect(first.imported).toBe(true);
    expect(first.destPath).toBeDefined();

    const second = await importBundleUpload({
      db,
      registryPath,
      registry: parsed.registry!,
      bundlePath: bundleSrc,
      enabled: true,
    });
    expect(second.imported).toBe(false);
    expect(second.destPath).toBe(first.destPath);

    // Edited bundle CONTENT with unchanged metadata.json must re-import;
    // hashing only metadata previously kept serving the stale copy.
    await writeFile(path.join(bundleSrc, "summary.md"), "# summary (edited)", "utf8");
    const third = await importBundleUpload({
      db,
      registryPath,
      registry: parsed.registry!,
      bundlePath: bundleSrc,
      enabled: true,
    });
    expect(third.imported).toBe(true);
    expect(third.destPath).not.toBe(first.destPath);
    const fsp = await import("node:fs/promises");
    expect(await fsp.readFile(path.join(third.destPath!, "summary.md"), "utf8")).toBe(
      "# summary (edited)",
    );

    // And the edited state is itself idempotent on the next re-import.
    const fourth = await importBundleUpload({
      db,
      registryPath,
      registry: parsed.registry!,
      bundlePath: bundleSrc,
      enabled: true,
    });
    expect(fourth.imported).toBe(false);
    expect(fourth.destPath).toBe(third.destPath);
  });
});
