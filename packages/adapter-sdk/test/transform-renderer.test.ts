import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { inspectRun, step } from "agent-inspect";
import { persistedInspectEventsToRunTrees } from "agent-inspect/persisted";
import { openTrace } from "agent-inspect/readers";
import { TraceDirectory } from "agent-inspect/advanced";

import {
  createKindFilterTransform,
  defineRenderer,
  defineTransform,
  renderWithSafety,
  runTransformPipeline,
} from "../src/index.js";

describe("transform and renderer contracts", () => {
  let traceDir: string;
  let events: Awaited<ReturnType<typeof openTrace>>["events"];

  beforeEach(async () => {
    traceDir = await mkdtemp(path.join(os.tmpdir(), "agent-inspect-transform-"));
    await inspectRun(
      "transform-renderer",
      async () => {
        await step.tool("search", async () => "ok");
      },
      { traceDir },
    );
    const td = new TraceDirectory({ dir: traceDir });
    const files = await td.list();
    const read = await openTrace({ type: "file", path: td.getPath(files[0]!) });
    events = read.events;
  });

  afterEach(async () => {
    await rm(traceDir, { recursive: true, force: true });
  });

  it("composes transform pipeline with warnings", () => {
    const annotate = defineTransform({
      id: "annotate",
      transform(input) {
        return {
          events: input.map((event) =>
            event.kind === "TOOL"
              ? { ...event, attributes: { ...event.attributes, tagged: true } }
              : event,
          ),
          warnings: [],
        };
      },
    });
    const filter = createKindFilterTransform(["TOOL", "RUN"]);

    const result = runTransformPipeline(events, [filter, annotate]);
    expect(result.events.some((event) => event.kind === "TOOL")).toBe(true);
    expect(result.events.every((event) => event.kind === "TOOL" || event.kind === "RUN")).toBe(
      true,
    );
    expect(result.warnings.some((warning) => warning.code === "transform.filter.removed")).toBe(
      true,
    );
  });

  it("renders with safety bounds and leak detection", () => {
    const renderer = defineRenderer({
      format: "text",
      render(tree) {
        return {
          content: `run:${tree.name}`,
          contentType: "text/plain",
          warnings: [],
        };
      },
    });

    const tree = persistedInspectEventsToRunTrees(events)[0]!;
    expect(tree).toBeDefined();

    const safe = renderWithSafety(renderer, tree, {
      maxContentLength: 100,
      redactionProfile: "share",
    });
    expect(safe.content).toContain("transform-renderer");
    expect(safe.warnings.some((warning) => warning.includes("redaction-profile:share"))).toBe(
      true,
    );

    const leak = renderWithSafety(
      defineRenderer({
        format: "text",
        render() {
          return {
            content: "leaked-secret-value",
            contentType: "text/plain",
            warnings: [],
          };
        },
      }),
      tree,
      { forbiddenRawStrings: ["leaked-secret-value"] },
    );
    expect(leak.warnings.some((warning) => warning.includes("forbidden-leak"))).toBe(true);
  });
});
