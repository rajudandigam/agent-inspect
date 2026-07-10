import { describe, expect, it } from "vitest";

import {
  inferPluginTypeFromName,
  isPluginPackageName,
  parsePluginManifest,
  validatePluginPrivacy,
} from "../src/manifest.js";

describe("plugin manifest", () => {
  it("detects plugin package names", () => {
    expect(isPluginPackageName("agent-inspect-adapter-demo")).toBe(true);
    expect(isPluginPackageName("@agent-inspect/langchain")).toBe(false);
    expect(inferPluginTypeFromName("agent-inspect-check-lint")).toBe("check");
  });

  it("parses a valid manifest", () => {
    const result = parsePluginManifest({
      schemaVersion: "1.0",
      id: "agent-inspect-adapter-demo",
      type: "adapter",
      name: "Demo Adapter",
      version: "1.0.0",
      privacy: {
        captureMode: "metadata-only",
        networkAllowed: false,
        uploadAllowed: false,
        redactionDocumented: true,
        frameworkDepsPackageScoped: true,
      },
    });
    expect(result.ok).toBe(true);
    expect(result.manifest?.id).toBe("agent-inspect-adapter-demo");
  });

  it("rejects invalid id prefix", () => {
    const result = parsePluginManifest({
      schemaVersion: "1.0",
      id: "not-a-plugin",
      type: "adapter",
      name: "Bad",
      version: "1.0.0",
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("prefix"))).toBe(true);
  });

  it("rejects string boolean privacy flags", () => {
    const result = parsePluginManifest({
      schemaVersion: "1.0",
      id: "agent-inspect-adapter-evil",
      type: "adapter",
      name: "Evil Adapter",
      version: "1.0.0",
      privacy: {
        captureMode: "metadata-only",
        networkAllowed: "false",
        uploadAllowed: "false",
      },
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("networkAllowed"))).toBe(true);
  });

  it("warns on unsafe privacy flags", () => {
    const result = parsePluginManifest({
      schemaVersion: "1.0",
      id: "agent-inspect-plugin-remote",
      type: "plugin",
      name: "Remote",
      version: "1.0.0",
      privacy: {
        captureMode: "metadata-only",
        networkAllowed: true,
        uploadAllowed: false,
        redactionDocumented: true,
        frameworkDepsPackageScoped: true,
      },
    });
    expect(result.ok).toBe(true);
    expect(result.warnings.some((w) => w.includes("network"))).toBe(true);
  });

  it("runs privacy checklist from manifest", () => {
    const parsed = parsePluginManifest({
      schemaVersion: "1.0",
      id: "agent-inspect-adapter-safe",
      type: "adapter",
      name: "Safe",
      version: "1.0.0",
      privacy: {
        captureMode: "metadata-only",
        redactionDocumented: true,
      },
    });
    expect(parsed.manifest).toBeDefined();
    const privacy = validatePluginPrivacy(parsed.manifest!);
    expect(privacy.ok).toBe(true);
  });
});
