import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createCliProgram } from "../src/index.js";
import {
  workspaceCleanCommand,
  workspaceDoctorCommand,
  workspaceInitCommand,
  workspacePathCommand,
  workspaceStatusCommand,
} from "../src/workspace.js";

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-cli-ws-"));
});

afterEach(async () => {
  process.exitCode = 0;
  vi.restoreAllMocks();
  await rm(tmpDir, { recursive: true, force: true });
});

describe("workspace CLI registration", () => {
  it("registers the workspace command with subcommands", () => {
    const program = createCliProgram();
    const workspace = program.commands.find((c) => c.name() === "workspace");
    expect(workspace).toBeDefined();
    const subs = workspace!.commands.map((c) => c.name());
    expect(subs).toEqual(
      expect.arrayContaining(["init", "status", "doctor", "clean", "path"]),
    );
  });
});

describe("workspace init", () => {
  it("creates a workspace and emits JSON", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await workspaceInitCommand({ cwd: tmpDir, project: "demo", json: true });
    const payload = JSON.parse(String(logSpy.mock.calls[0]?.[0]));
    expect(payload.ok).toBe(true);
    expect(payload.created).toBe(true);
    expect(payload.project).toBe("demo");
    await readFile(path.join(tmpDir, ".agent-inspect", "workspace.json"), "utf-8");
  });

  it("dry-run writes nothing", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await workspaceInitCommand({ cwd: tmpDir, project: "demo", dryRun: true, json: true });
    const payload = JSON.parse(String(logSpy.mock.calls[0]?.[0]));
    expect(payload.dryRun).toBe(true);
    await expect(
      readFile(path.join(tmpDir, ".agent-inspect", "workspace.json"), "utf-8"),
    ).rejects.toThrow();
  });
});

describe("workspace status", () => {
  it("fails cleanly with no workspace", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await workspaceStatusCommand({ cwd: tmpDir });
    expect(process.exitCode).toBe(1);
    expect(errSpy.mock.calls.some((c) => String(c[0]).includes("no workspace"))).toBe(true);
  });

  it("reports counts as JSON", async () => {
    await workspaceInitCommand({ cwd: tmpDir, project: "counts" });
    await writeFile(path.join(tmpDir, ".agent-inspect", "runs", "a.jsonl"), "{}\n", "utf-8");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await workspaceStatusCommand({ cwd: tmpDir, json: true });
    const payload = JSON.parse(String(logSpy.mock.calls[0]?.[0]));
    expect(payload.ok).toBe(true);
    expect(payload.traceFiles).toBe(1);
  });
});

describe("workspace doctor", () => {
  it("passes for a healthy workspace", async () => {
    await workspaceInitCommand({ cwd: tmpDir, project: "healthy" });
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await workspaceDoctorCommand({ cwd: tmpDir, json: true });
    const payload = JSON.parse(String(logSpy.mock.calls[0]?.[0]));
    expect(payload.ok).toBe(true);
  });

  it("sets exit code when unhealthy", async () => {
    const wsDir = path.join(tmpDir, ".agent-inspect");
    await mkdir(wsDir, { recursive: true });
    await writeFile(path.join(wsDir, "workspace.json"), '{"schemaVersion":"9.9"}', "utf-8");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await workspaceDoctorCommand({ cwd: tmpDir, json: true });
    const payload = JSON.parse(String(logSpy.mock.calls[0]?.[0]));
    expect(payload.ok).toBe(false);
    expect(process.exitCode).toBe(1);
  });
});

describe("workspace clean", () => {
  it("dry-runs by default and preserves traces", async () => {
    await workspaceInitCommand({ cwd: tmpDir, project: "clean" });
    const wsDir = path.join(tmpDir, ".agent-inspect");
    await writeFile(path.join(wsDir, "runs", "keep.jsonl"), "{}\n", "utf-8");
    await writeFile(path.join(wsDir, "reports", "r.md"), "# r\n", "utf-8");

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await workspaceCleanCommand({ cwd: tmpDir, json: true });
    const payload = JSON.parse(String(logSpy.mock.calls[0]?.[0]));
    expect(payload.dryRun).toBe(true);
    expect(payload.removed).toContain("reports/r.md");

    const trace = await readFile(path.join(wsDir, "runs", "keep.jsonl"), "utf-8");
    expect(trace).toBe("{}\n");
  });

  it("deletes generated content with --yes", async () => {
    await workspaceInitCommand({ cwd: tmpDir, project: "clean2" });
    const wsDir = path.join(tmpDir, ".agent-inspect");
    await writeFile(path.join(wsDir, "reports", "r.md"), "# r\n", "utf-8");

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await workspaceCleanCommand({ cwd: tmpDir, yes: true, json: true });
    const payload = JSON.parse(String(logSpy.mock.calls[0]?.[0]));
    expect(payload.dryRun).toBe(false);
    await expect(readFile(path.join(wsDir, "reports", "r.md"), "utf-8")).rejects.toThrow();
  });
});

describe("workspace path", () => {
  it("prints resolved paths as JSON", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await workspacePathCommand({ cwd: tmpDir, json: true });
    const payload = JSON.parse(String(logSpy.mock.calls[0]?.[0]));
    expect(payload.ok).toBe(true);
    expect(payload.workspaceDir).toContain(".agent-inspect");
  });
});
