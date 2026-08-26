import { copyFile, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it, vi } from "vitest";
import { findFirstCausalFailure } from "agent-inspect/advanced";
import type { TraceCheckResult } from "agent-inspect/checks";
import { persistedInspectEventsToTraceEvents } from "agent-inspect/persisted";
import { openTraceFile } from "agent-inspect/readers";

import { checkCommand } from "../../cli/src/check.js";
import { reportCommand } from "../../cli/src/report.js";
import { callReadOnlyTool, createMcpServerContext } from "../src/tools.js";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.resolve(testDir, "../../../fixtures/traces");

type CausalProjection = {
  kind: string;
  evidenceIds: string[];
  primaryName?: string;
  primaryStepId?: string;
  relationshipRole?: string;
  relatedIds: string[];
};

type ReportPayload = {
  content: string;
};

function projectCausal(value: {
  kind: string;
  evidenceIds: string[];
  primary?: { name?: string; stepId?: string };
  relationship?: { role: string; relatedIds: string[] };
}): CausalProjection {
  return {
    kind: value.kind,
    evidenceIds: [...value.evidenceIds],
    ...(value.primary?.name ? { primaryName: value.primary.name } : {}),
    ...(value.primary?.stepId ? { primaryStepId: value.primary.stepId } : {}),
    ...(value.relationship?.role ? { relationshipRole: value.relationship.role } : {}),
    relatedIds: [...(value.relationship?.relatedIds ?? [])],
  };
}

function contractFindingsFromCheck(check: TraceCheckResult) {
  return check.findings
    .filter((finding) => finding.status === "fail")
    .map((finding) => ({
      ruleId: finding.ruleId,
      status: finding.status,
      evidenceIds: finding.evidence
        .map((item) => item.eventId ?? item.parentId)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
      message: finding.message,
    }));
}

function firstTimelineErrorName(content: string): string | undefined {
  const timeline = content.split("## Timeline")[1]?.split("## Observed outcomes")[0];
  const firstError = timeline
    ?.split("\n")
    .map((line) => line.trim())
    .find((line) => /^\+\S+\s+.+\s+\([^)]*\)\s+error$/.test(line));
  const label = firstError?.match(/^\+\S+\s+(.+?)\s+\([^)]*\)\s+error$/)?.[1];
  if (!label) return undefined;
  const separator = label.indexOf(":");
  return separator >= 0 ? label.slice(separator + 1) : label;
}

describe("first causal failure surface parity", () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    vi.restoreAllMocks();
    process.exitCode = 0;
    await Promise.all(
      tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
    );
  });

  it.each([
    {
      file: "minimal-error.jsonl",
      runId: "minimal-error",
      expectedName: "failing-step",
      expectedStepId: "step_fail",
      ambiguity: false,
    },
    {
      file: "causal-linked-errors.jsonl",
      runId: "causal-linked-errors",
      expectedName: "fetch-policy",
      expectedStepId: "root_fetch",
      ambiguity: false,
    },
    {
      file: "causal-unlinked-errors.jsonl",
      runId: "causal-unlinked-errors",
      expectedName: "validate-input",
      expectedStepId: "error_a",
      ambiguity: true,
    },
  ])(
    "keeps report, check evidence, and read-only MCP aligned for $runId",
    async ({ file, runId, expectedName, expectedStepId, ambiguity }) => {
      const fixture = path.join(fixturesDir, file);
      const tempRoot = await mkdtemp(
        path.join(os.tmpdir(), "agent-inspect-causal-parity-"),
      );
      tempDirs.push(tempRoot);
      const tracePath = path.join(tempRoot, file);
      await copyFile(fixture, tracePath);

      const read = await openTraceFile(tracePath);
      const legacyEvents = persistedInspectEventsToTraceEvents(read.events);
      const canonical = findFirstCausalFailure(legacyEvents);
      expect(projectCausal(canonical)).toMatchObject({
        kind: "explicit_error_event",
        evidenceIds: [expectedStepId],
        primaryName: expectedName,
        primaryStepId: expectedStepId,
      });

      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      vi.spyOn(console, "error").mockImplementation(() => {});

      await reportCommand(runId, { dir: tempRoot, json: true });
      expect(process.exitCode ?? 0).toBe(0);
      const report = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0])) as ReportPayload;
      expect(firstTimelineErrorName(report.content)).toBe(expectedName);

      logSpy.mockClear();
      process.exitCode = 0;
      await checkCommand(runId, {
        dir: tempRoot,
        json: true,
        rule: ["run.status"],
      });
      expect(process.exitCode).toBe(1);
      const check = JSON.parse(String(logSpy.mock.calls.at(-1)?.[0])) as TraceCheckResult;
      expect(check.status).toBe("fail");
      const contractFindings = contractFindingsFromCheck(check);
      expect(contractFindings).toEqual([
        expect.objectContaining({ ruleId: "run.status", evidenceIds: [] }),
      ]);
      expect(
        projectCausal(findFirstCausalFailure(legacyEvents, { contractFindings })),
      ).toEqual(projectCausal(canonical));

      const beforeMcpRead = await readdir(tempRoot);
      const beforeMcpBytes = await readFile(tracePath);
      const mcpResult = await callReadOnlyTool(
        createMcpServerContext({ traceDir: tempRoot }),
        "get_first_causal_failure",
        { runId },
      );
      expect(mcpResult.isError).toBe(false);
      const mcp = JSON.parse(mcpResult.content[0]!.text as string) as Parameters<
        typeof projectCausal
      >[0];
      expect(projectCausal(mcp)).toEqual(projectCausal(canonical));
      expect(await readdir(tempRoot)).toEqual(beforeMcpRead);
      expect(await readFile(tracePath)).toEqual(beforeMcpBytes);

      if (ambiguity) {
        expect(mcp.relationship).toEqual({ role: "self", relatedIds: [] });
        expect(mcp.evidenceIds).not.toContain("error_b");
      }
    },
  );

  it("keeps linked check evidence aligned with the first causal failure", async () => {
    const file = "causal-linked-errors.jsonl";
    const runId = "causal-linked-errors";

    const fixture = path.join(fixturesDir, file);
    const tempRoot = await mkdtemp(
      path.join(os.tmpdir(), "agent-inspect-causal-parity-"),
    );
    tempDirs.push(tempRoot);

    const tracePath = path.join(tempRoot, file);
    await copyFile(fixture, tracePath);

    const read = await openTraceFile(tracePath);
    const legacyEvents = persistedInspectEventsToTraceEvents(read.events);
    const canonical = findFirstCausalFailure(legacyEvents);

    expect(projectCausal(canonical)).toMatchObject({
      kind: "explicit_error_event",
      evidenceIds: ["root_fetch"],
      primaryName: "fetch-policy",
      primaryStepId: "root_fetch",
    });

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    await checkCommand(runId, {
      dir: tempRoot,
      json: true,
      rule: ["tool.usage"],
      forbiddenTool: ["fetch-policy"],
    });

    expect(process.exitCode).toBe(1);

    const check = JSON.parse(
      String(logSpy.mock.calls.at(-1)?.[0]),
    ) as TraceCheckResult;

    expect(check.status).toBe("fail");

    const failedFinding = check.findings.find(
      (finding) =>
        finding.ruleId === "tool.usage" && finding.status === "fail",
    );

    expect(failedFinding).toBeDefined();
    expect(failedFinding?.evidence).toEqual([
      expect.objectContaining({
        runId,
        kind: "TOOL",
        name: "fetch-policy",
        status: "error",
      }),
    ]);

    expect(failedFinding?.evidence[0]?.eventId).toBeTruthy();

    const contractFindings = contractFindingsFromCheck(check);

    expect(contractFindings).toHaveLength(1);
    expect(contractFindings[0]).toEqual(
      expect.objectContaining({
        ruleId: "tool.usage",
        status: "fail",
      }),
    );

    expect(contractFindings[0]?.evidenceIds).toEqual([
      failedFinding?.evidence[0]?.eventId,
    ]);

    expect(contractFindings[0]?.evidenceIds[0]).toBeTruthy();

    const withCheckEvidence = findFirstCausalFailure(legacyEvents, {
      contractFindings,
    });

    expect(projectCausal(withCheckEvidence)).toEqual(
      projectCausal(canonical),
    );
  });
});
