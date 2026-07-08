import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { validateEvent } from "../../src/storage.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

const REQUIRED_TRACES = [
  "fixtures/traces/minimal-success.jsonl",
  "fixtures/traces/minimal-error.jsonl",
  "fixtures/traces/nested-3-levels.jsonl",
  "fixtures/traces/parallel-siblings.jsonl",
  "fixtures/traces/llm-with-tokens.jsonl",
  "fixtures/traces/tool-with-io.jsonl",
  "fixtures/traces/long-running.jsonl",
  "fixtures/traces/error-recovery.jsonl",
  "fixtures/traces/tool-retry-success.jsonl",
  "fixtures/traces/repeated-tool-args.jsonl",
  "fixtures/traces/tool-timeout-stall.jsonl",
  "fixtures/traces/dual-format-parity.jsonl",
];

describe("canonical fixtures", () => {
  it("fixture validation script exists", () => {
    const p = path.join(repoRoot, "scripts/validate-fixtures.mjs");
    expect(fs.existsSync(p)).toBe(true);
  });

  it("required trace fixtures exist and validate as v0.1 JSONL", () => {
    for (const rel of REQUIRED_TRACES) {
      const abs = path.join(repoRoot, rel);
      expect(fs.existsSync(abs), rel).toBe(true);
      const text = fs.readFileSync(abs, "utf8");
      const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
      expect(lines.length).toBeGreaterThan(0);
      for (const line of lines) {
        const row = JSON.parse(line) as unknown;
        expect(validateEvent(row), rel).toBe(true);
        expect((row as { schemaVersion?: string }).schemaVersion).toBe("0.1");
      }
    }
  });

  it("config fixtures parse", () => {
    const proactive = JSON.parse(
      fs.readFileSync(
        path.join(repoRoot, "fixtures/configs/proactive-agent-inspect.logs.json"),
        "utf8",
      ),
    ) as { runIdKeys: unknown; eventKey: unknown };
    expect(Array.isArray(proactive.runIdKeys)).toBe(true);
    expect(typeof proactive.eventKey).toBe("string");
    const minimal = JSON.parse(
      fs.readFileSync(
        path.join(repoRoot, "fixtures/configs/minimal-agent-inspect.logs.json"),
        "utf8",
      ),
    ) as { runIdKeys: unknown; eventKey: unknown };
    expect(Array.isArray(minimal.runIdKeys)).toBe(true);
  });
});
