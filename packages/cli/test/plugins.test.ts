import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  discoverPlugins,
  pluginsDoctorCommand,
  pluginsListCommand,
  pluginsValidateCommand,
  validatePluginPackage,
} from "../src/plugins.js";

const VALID_MANIFEST = {
  schemaVersion: "1.0",
  id: "agent-inspect-adapter-fixture",
  type: "adapter",
  name: "Fixture Adapter",
  version: "1.0.0",
  privacy: {
    captureMode: "metadata-only",
    networkAllowed: false,
    uploadAllowed: false,
    redactionDocumented: true,
    frameworkDepsPackageScoped: true,
  },
};

describe("plugins CLI", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-cli-plugins-"));
    const pluginDir = path.join(tmpDir, "node_modules", "agent-inspect-adapter-fixture");
    await mkdir(pluginDir, { recursive: true });
    await writeFile(
      path.join(pluginDir, "package.json"),
      JSON.stringify({ name: "agent-inspect-adapter-fixture", version: "1.0.0" }),
      "utf8",
    );
    await writeFile(
      path.join(pluginDir, "agent-inspect-plugin.manifest.json"),
      JSON.stringify(VALID_MANIFEST),
      "utf8",
    );
  });

  afterEach(async () => {
    process.exitCode = 0;
    vi.restoreAllMocks();
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("discovers installed plugin packages", async () => {
    const plugins = await discoverPlugins(tmpDir);
    expect(plugins.map((p) => p.packageName)).toEqual(["agent-inspect-adapter-fixture"]);
  });

  it("validates a plugin package", async () => {
    const result = await validatePluginPackage("agent-inspect-adapter-fixture", tmpDir);
    expect(result.ok).toBe(true);
    expect(result.manifest?.type).toBe("adapter");
  });

  it("lists plugins", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await pluginsListCommand(tmpDir);
    expect(String(logSpy.mock.calls[0]?.[0])).toContain("agent-inspect-adapter-fixture");
  });

  it("doctor passes for valid plugin", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await pluginsDoctorCommand(tmpDir);
    expect(String(logSpy.mock.calls[0]?.[0])).toContain("OK");
    expect(process.exitCode).toBeFalsy();
  });

  it("validate reports errors for unsafe plugin", async () => {
    const unsafeDir = path.join(tmpDir, "node_modules", "agent-inspect-plugin-unsafe");
    await mkdir(unsafeDir, { recursive: true });
    await writeFile(
      path.join(unsafeDir, "package.json"),
      JSON.stringify({ name: "agent-inspect-plugin-unsafe" }),
      "utf8",
    );
    await writeFile(
      path.join(unsafeDir, "agent-inspect-plugin.manifest.json"),
      JSON.stringify({
        ...VALID_MANIFEST,
        id: "agent-inspect-plugin-unsafe",
        type: "plugin",
        privacy: {
          captureMode: "full",
          networkAllowed: true,
          uploadAllowed: true,
          redactionDocumented: false,
          frameworkDepsPackageScoped: false,
        },
      }),
      "utf8",
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    await pluginsValidateCommand("agent-inspect-plugin-unsafe", tmpDir);
    expect(process.exitCode).toBe(1);
    expect(errorSpy.mock.calls.length + warnSpy.mock.calls.length).toBeGreaterThan(0);
  });
});
