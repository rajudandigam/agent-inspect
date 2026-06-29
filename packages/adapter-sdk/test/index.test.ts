import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { inspectRun, step } from "agent-inspect";
import { openTrace } from "agent-inspect/readers";
import { TraceDirectory } from "agent-inspect/advanced";

import {
  clearAdapterRegistry,
  createAdapterFixtureSkeleton,
  createAdapterRegistration,
  eventsToJsonl,
  listRegisteredAdapters,
  registerAdapter,
  runAdapterConformance,
  runPrivacyChecklist,
  stableStringify,
} from "../src/index.js";

describe("@agent-inspect/adapter-sdk", () => {
  beforeEach(() => {
    clearAdapterRegistry();
  });

  it("registers adapters in stable order", () => {
    registerAdapter(
      createAdapterRegistration({
        id: "beta",
        name: "Beta",
        version: "0.1.0",
        framework: "fixture",
      }),
    );
    registerAdapter(
      createAdapterRegistration({
        id: "alpha",
        name: "Alpha",
        version: "0.1.0",
        framework: "fixture",
      }),
    );
    expect(listRegisteredAdapters().map((item) => item.id)).toEqual(["alpha", "beta"]);
  });

  it("runs privacy checklist with metadata-only default", () => {
    const result = runPrivacyChecklist({
      captureMode: "metadata-only",
      redactionDocumented: true,
    });
    expect(result.ok).toBe(true);
  });

  it("creates fixture skeleton guidance", () => {
    const skeleton = createAdapterFixtureSkeleton("demo-adapter");
    expect(skeleton.captureDefault).toBe("metadata-only");
    expect(skeleton.suggestedCovers.length).toBeGreaterThan(0);
  });

  describe("runAdapterConformance", () => {
    let traceDir: string;

    beforeEach(async () => {
      traceDir = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-adapter-sdk-"));
      await inspectRun(
        "adapter-sdk-conformance",
        async () => {
          await step.tool("search", async () => "ok");
        },
        { traceDir },
      );
    });

    afterEach(async () => {
      await rm(traceDir, { recursive: true, force: true });
    });

    it("passes conformance for a captured manual trace", async () => {
      const td = new TraceDirectory({ dir: traceDir });
      const files = await td.list();
      expect(files.length).toBeGreaterThan(0);
      const read = await openTrace({ type: "file", path: td.getPath(files[0]!) });
      const events = read.events;
      const result = await runAdapterConformance({
        adapterId: "manual-fixture",
        events,
        forbiddenRawStrings: ["super-secret-token"],
      });
      expect(result.ok).toBe(true);
      expect(eventsToJsonl(events).length).toBeGreaterThan(0);
      expect(stableStringify(result.checks)).toContain("reader-round-trip");
      expect(events.some((event) => event.kind === "TOOL")).toBe(true);
    });
  });
});
