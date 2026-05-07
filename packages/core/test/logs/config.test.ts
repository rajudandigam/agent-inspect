import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  DEFAULT_LOG_INGEST_CONFIG,
  loadLogIngestConfig,
  mergeLogIngestConfig,
} from "../../src/logs/config.js";

describe("logs config", () => {
  it("returns default config when no path provided", async () => {
    const cfg = await loadLogIngestConfig();
    expect(cfg.eventKey).toBe("event");
    expect(cfg.runIdKeys.length).toBeGreaterThan(0);
  });

  it("merge allows user mappings override", () => {
    const merged = mergeLogIngestConfig(DEFAULT_LOG_INGEST_CONFIG, {
      mappings: { "*.error": { kind: "ERROR", name: "custom" } },
    });
    expect(merged.mappings?.["*.error"]?.name).toBe("custom");
  });

  it("loads JSON config and overrides runIdKeys and eventKey", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-logcfg-"));
    const file = path.join(dir, "config.json");
    await writeFile(
      file,
      JSON.stringify({ runIdKeys: ["decisionId"], eventKey: "evt" }),
      "utf-8",
    );
    const cfg = await loadLogIngestConfig(file);
    expect(cfg.runIdKeys).toEqual(["decisionId"]);
    expect(cfg.eventKey).toBe("evt");
    await rm(dir, { recursive: true, force: true });
  });

  it("invalid JSON fails clearly", async () => {
    const file = path.join(os.tmpdir(), `agent-inspect-logcfg-bad-${Date.now()}.json`);
    await writeFile(file, "{ not json", "utf-8");
    await expect(loadLogIngestConfig(file)).rejects.toThrow(/Invalid JSON/i);
    await rm(file, { force: true });
  });

  it("invalid runIdKeys fails", async () => {
    const file = path.join(os.tmpdir(), `agent-inspect-logcfg-badkeys-${Date.now()}.json`);
    await writeFile(file, JSON.stringify({ runIdKeys: [] }), "utf-8");
    await expect(loadLogIngestConfig(file)).rejects.toThrow(/runIdKeys/i);
    await rm(file, { force: true });
  });

  it("invalid eventKey fails", async () => {
    const file = path.join(os.tmpdir(), `agent-inspect-logcfg-badevt-${Date.now()}.json`);
    await writeFile(file, JSON.stringify({ eventKey: "" }), "utf-8");
    await expect(loadLogIngestConfig(file)).rejects.toThrow(/eventKey/i);
    await rm(file, { force: true });
  });

  it("invalid redact strategy fails", async () => {
    const file = path.join(os.tmpdir(), `agent-inspect-logcfg-badred-${Date.now()}.json`);
    await writeFile(
      file,
      JSON.stringify({ redact: [{ key: "x", strategy: "nope" }] }),
      "utf-8",
    );
    await expect(loadLogIngestConfig(file)).rejects.toThrow(/redact\.strategy/i);
    await rm(file, { force: true });
  });

  it("missing file fails clearly", async () => {
    const file = path.join(os.tmpdir(), `agent-inspect-logcfg-missing-${Date.now()}.json`);
    await expect(loadLogIngestConfig(file)).rejects.toThrow(/Failed to read config file/i);
  });
});

