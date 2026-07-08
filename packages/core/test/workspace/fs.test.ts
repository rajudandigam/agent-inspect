import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  cleanWorkspace,
  createWorkspace,
  doctorWorkspace,
  getWorkspaceStatus,
  readWorkspaceManifestFile,
  resolveInsideWorkspace,
  resolveWorkspaceLocation,
} from "../../src/workspace/index.js";

let root: string;

beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), "ai-workspace-"));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("resolveInsideWorkspace", () => {
  it("resolves relative paths inside the workspace", () => {
    const abs = resolveInsideWorkspace("/ws", "runs");
    expect(abs).toBe(path.resolve("/ws/runs"));
  });

  it("rejects traversal outside the workspace", () => {
    expect(() => resolveInsideWorkspace("/ws", "../escape")).toThrow(/outside the workspace/);
  });
});

describe("createWorkspace", () => {
  it("creates a manifest and the standard folders", async () => {
    const result = await createWorkspace({ cwd: root, project: "demo" });
    expect(result.created).toBe(true);
    expect(result.adopted).toBe(false);
    expect(result.createdDirs).toEqual(
      expect.arrayContaining(["runs", "reports", "artifacts", "bundles", "notes", "index"]),
    );

    const read = await readWorkspaceManifestFile(result.location);
    expect(read.ok).toBe(true);
    expect(read.manifest?.project).toBe("demo");
  });

  it("dry-run writes nothing", async () => {
    const result = await createWorkspace({ cwd: root, project: "demo", dryRun: true });
    expect(result.dryRun).toBe(true);
    const read = await readWorkspaceManifestFile(result.location);
    expect(read.exists).toBe(false);
  });

  it("adopts an existing manifest without rewriting it", async () => {
    const first = await createWorkspace({ cwd: root, project: "original" });
    const before = await readFile(first.location.manifestPath, "utf-8");

    const second = await createWorkspace({ cwd: root, project: "changed" });
    expect(second.created).toBe(false);
    expect(second.adopted).toBe(true);

    const after = await readFile(first.location.manifestPath, "utf-8");
    expect(after).toBe(before);
    expect(second.manifest.project).toBe("original");
  });

  it("adopts existing top-level traces without deleting them", async () => {
    const wsDir = path.join(root, ".agent-inspect");
    await mkdir(wsDir, { recursive: true });
    await writeFile(path.join(wsDir, "run_legacy.jsonl"), '{"schemaVersion":"0.1"}\n', "utf-8");

    const result = await createWorkspace({ cwd: root, project: "adopted" });
    expect(result.detectedExistingTraces).toBe(true);
    expect(result.manifest.traceDirs).toContain(".");

    const legacy = await readFile(path.join(wsDir, "run_legacy.jsonl"), "utf-8");
    expect(legacy).toContain("0.1");
  });
});

describe("getWorkspaceStatus", () => {
  it("counts traces, reports, artifacts, bundles, and notes", async () => {
    const created = await createWorkspace({ cwd: root, project: "counts" });
    const ws = created.location.workspaceDir;
    await writeFile(path.join(ws, "runs", "a.jsonl"), "{}\n", "utf-8");
    await writeFile(path.join(ws, "runs", "b.jsonl"), "{}\n", "utf-8");
    await writeFile(path.join(ws, "reports", "r.md"), "# report\n", "utf-8");

    const status = await getWorkspaceStatus(created.location, created.manifest);
    expect(status.traceFiles).toBe(2);
    expect(status.reports).toBe(1);
    expect(status.artifacts).toBe(0);
    expect(status.index.exists).toBe(true);
    expect(status.index.enabled).toBe(false);
  });
});

describe("doctorWorkspace", () => {
  it("fails when no manifest exists", async () => {
    const location = resolveWorkspaceLocation(root);
    const result = await doctorWorkspace(location);
    expect(result.ok).toBe(false);
    expect(result.checks[0]?.id).toBe("manifest");
    expect(result.checks[0]?.status).toBe("fail");
  });

  it("passes for a freshly created workspace", async () => {
    const created = await createWorkspace({ cwd: root, project: "healthy" });
    const result = await doctorWorkspace(created.location);
    expect(result.ok).toBe(true);
    expect(result.checks.some((c) => c.id === "manifest" && c.status === "pass")).toBe(true);
  });

  it("fails when the manifest is invalid", async () => {
    const location = resolveWorkspaceLocation(root);
    await mkdir(location.workspaceDir, { recursive: true });
    await writeFile(location.manifestPath, '{"schemaVersion":"9.9"}', "utf-8");
    const result = await doctorWorkspace(location);
    expect(result.ok).toBe(false);
  });
});

describe("cleanWorkspace", () => {
  it("is a dry-run by default and never touches traces", async () => {
    const created = await createWorkspace({ cwd: root, project: "clean" });
    const ws = created.location.workspaceDir;
    await writeFile(path.join(ws, "runs", "keep.jsonl"), "{}\n", "utf-8");
    await writeFile(path.join(ws, "reports", "r.md"), "# report\n", "utf-8");

    const dry = await cleanWorkspace(created.location, created.manifest);
    expect(dry.dryRun).toBe(true);
    expect(dry.removed).toContain("reports/r.md");

    const stillThere = await readFile(path.join(ws, "reports", "r.md"), "utf-8");
    expect(stillThere).toContain("report");
    const trace = await readFile(path.join(ws, "runs", "keep.jsonl"), "utf-8");
    expect(trace).toBe("{}\n");
  });

  it("removes generated content when confirmed but preserves traces", async () => {
    const created = await createWorkspace({ cwd: root, project: "clean2" });
    const ws = created.location.workspaceDir;
    await writeFile(path.join(ws, "runs", "keep.jsonl"), "{}\n", "utf-8");
    await writeFile(path.join(ws, "reports", "r.md"), "# report\n", "utf-8");
    await writeFile(path.join(ws, "artifacts", "a.json"), "{}\n", "utf-8");

    const result = await cleanWorkspace(created.location, created.manifest, { confirm: true });
    expect(result.dryRun).toBe(false);
    expect(result.removed).toEqual(
      expect.arrayContaining(["reports/r.md", "artifacts/a.json"]),
    );

    await expect(readFile(path.join(ws, "reports", "r.md"), "utf-8")).rejects.toThrow();
    const trace = await readFile(path.join(ws, "runs", "keep.jsonl"), "utf-8");
    expect(trace).toBe("{}\n");
  });
});
