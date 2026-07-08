import { describe, expect, it } from "vitest";

import {
  DEFAULT_WORKSPACE_LAYOUT,
  MAX_WORKSPACE_MANIFEST_BYTES,
  createDefaultWorkspaceManifest,
  isSafeRelativeWorkspacePath,
  parseWorkspaceManifest,
  serializeWorkspaceManifest,
  validateWorkspaceManifest,
} from "../../src/workspace/index.js";
import type { AgentInspectWorkspaceManifest } from "../../src/workspace/index.js";

function validManifest(): AgentInspectWorkspaceManifest {
  return {
    schemaVersion: "1.0",
    project: "support-agent",
    createdAt: "2026-07-08T00:00:00.000Z",
    traceDirs: ["runs"],
    reportsDir: "reports",
    artifactsDir: "artifacts",
    bundlesDir: "bundles",
    notesDir: "notes",
    redactionProfile: "share",
    index: { enabled: false, type: "none" },
  };
}

describe("createDefaultWorkspaceManifest", () => {
  it("uses the standard layout and share redaction by default", () => {
    const m = createDefaultWorkspaceManifest({
      project: "demo",
      createdAt: "2026-07-08T00:00:00.000Z",
    });
    expect(m.schemaVersion).toBe("1.0");
    expect(m.project).toBe("demo");
    expect(m.traceDirs).toEqual([...DEFAULT_WORKSPACE_LAYOUT.traceDirs]);
    expect(m.reportsDir).toBe("reports");
    expect(m.redactionProfile).toBe("share");
    expect(m.index).toEqual({ enabled: false, type: "none" });
  });

  it("produces a manifest that passes validation", () => {
    const m = createDefaultWorkspaceManifest({ project: "demo" });
    expect(validateWorkspaceManifest(m).ok).toBe(true);
  });

  it("trims the project name and honors overrides", () => {
    const m = createDefaultWorkspaceManifest({
      project: "  spaced  ",
      redactionProfile: "strict",
      index: { enabled: true, type: "sqlite", path: "index/index.db" },
    });
    expect(m.project).toBe("spaced");
    expect(m.redactionProfile).toBe("strict");
    expect(m.index).toEqual({ enabled: true, type: "sqlite", path: "index/index.db" });
  });
});

describe("isSafeRelativeWorkspacePath", () => {
  it("accepts relative paths inside the workspace", () => {
    expect(isSafeRelativeWorkspacePath("runs")).toBe(true);
    expect(isSafeRelativeWorkspacePath("nested/runs")).toBe(true);
  });

  it("rejects absolute paths, drive roots, traversal, and empty values", () => {
    expect(isSafeRelativeWorkspacePath("/abs")).toBe(false);
    expect(isSafeRelativeWorkspacePath("\\abs")).toBe(false);
    expect(isSafeRelativeWorkspacePath("C:/abs")).toBe(false);
    expect(isSafeRelativeWorkspacePath("../escape")).toBe(false);
    expect(isSafeRelativeWorkspacePath("runs/../../escape")).toBe(false);
    expect(isSafeRelativeWorkspacePath("")).toBe(false);
    expect(isSafeRelativeWorkspacePath(42)).toBe(false);
  });
});

describe("validateWorkspaceManifest", () => {
  it("accepts a valid manifest and normalizes whitespace", () => {
    const input = { ...validManifest(), project: "  support-agent  " };
    const result = validateWorkspaceManifest(input);
    expect(result.ok).toBe(true);
    expect(result.manifest?.project).toBe("support-agent");
    expect(result.errors).toHaveLength(0);
  });

  it("rejects non-object input", () => {
    expect(validateWorkspaceManifest(null).ok).toBe(false);
    expect(validateWorkspaceManifest("x").ok).toBe(false);
    expect(validateWorkspaceManifest([]).ok).toBe(false);
  });

  it("rejects an unsupported schemaVersion", () => {
    const result = validateWorkspaceManifest({ ...validManifest(), schemaVersion: "2.0" });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("schemaVersion"))).toBe(true);
  });

  it("rejects an empty project", () => {
    const result = validateWorkspaceManifest({ ...validManifest(), project: "   " });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("project"))).toBe(true);
  });

  it("rejects an invalid createdAt", () => {
    const result = validateWorkspaceManifest({ ...validManifest(), createdAt: "not-a-date" });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("createdAt"))).toBe(true);
  });

  it("rejects empty or unsafe traceDirs", () => {
    expect(validateWorkspaceManifest({ ...validManifest(), traceDirs: [] }).ok).toBe(false);
    const traversal = validateWorkspaceManifest({
      ...validManifest(),
      traceDirs: ["../secrets"],
    });
    expect(traversal.ok).toBe(false);
    expect(traversal.errors.some((e) => e.includes("traceDirs[0]"))).toBe(true);
  });

  it("rejects absolute directory fields", () => {
    const result = validateWorkspaceManifest({ ...validManifest(), reportsDir: "/tmp/out" });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("reportsDir"))).toBe(true);
  });

  it("rejects an invalid redaction profile", () => {
    const result = validateWorkspaceManifest({ ...validManifest(), redactionProfile: "public" });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("redactionProfile"))).toBe(true);
  });

  it("rejects an invalid index shape", () => {
    expect(validateWorkspaceManifest({ ...validManifest(), index: "none" }).ok).toBe(false);
    const badType = validateWorkspaceManifest({
      ...validManifest(),
      index: { enabled: true, type: "redis" },
    });
    expect(badType.ok).toBe(false);
    expect(badType.errors.some((e) => e.includes("index.type"))).toBe(true);
  });

  it("warns when an index type is set but disabled", () => {
    const result = validateWorkspaceManifest({
      ...validManifest(),
      index: { enabled: false, type: "sqlite", path: "index/i.db" },
    });
    expect(result.ok).toBe(true);
    expect(result.warnings.some((w) => w.includes("index.enabled is false"))).toBe(true);
  });
});

describe("parseWorkspaceManifest", () => {
  it("parses and validates a serialized manifest", () => {
    const json = serializeWorkspaceManifest(validManifest());
    const result = parseWorkspaceManifest(json);
    expect(result.ok).toBe(true);
    expect(result.manifest?.project).toBe("support-agent");
  });

  it("round-trips a default manifest", () => {
    const manifest = createDefaultWorkspaceManifest({
      project: "roundtrip",
      createdAt: "2026-07-08T00:00:00.000Z",
    });
    const result = parseWorkspaceManifest(serializeWorkspaceManifest(manifest));
    expect(result.ok).toBe(true);
    expect(result.manifest).toEqual(manifest);
  });

  it("rejects invalid JSON without throwing", () => {
    const result = parseWorkspaceManifest("{ not json");
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("valid JSON"))).toBe(true);
  });

  it("rejects oversized input", () => {
    const huge = `${" ".repeat(MAX_WORKSPACE_MANIFEST_BYTES + 1)}`;
    const result = parseWorkspaceManifest(huge);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("maximum size"))).toBe(true);
  });
});

describe("serializeWorkspaceManifest", () => {
  it("emits pretty JSON with a trailing newline", () => {
    const json = serializeWorkspaceManifest(validManifest());
    expect(json.endsWith("\n")).toBe(true);
    expect(json).toContain('"schemaVersion": "1.0"');
  });
});
