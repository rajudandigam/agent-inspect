import { describe, expect, it } from "vitest";

import * as advanced from "../src/entries/advanced.js";
import * as checks from "../src/entries/checks.js";
import * as diff from "../src/entries/diff.js";
import * as exporters from "../src/entries/exporters.js";
import * as logs from "../src/entries/logs.js";
import * as persisted from "../src/entries/persisted.js";
import * as readers from "../src/entries/readers.js";
import * as reporters from "../src/entries/reporters.js";
import * as workspace from "../src/entries/workspace.js";
import * as writers from "../src/entries/writers.js";
import * as core from "../src/index.js";

const ROOT_VALUE_EXPORTS_ALLOWLIST = [
  "createInspector",
  "getCurrentCorrelationMetadata",
  "inspectRun",
  "maybeInspectRun",
  "observe",
  "step",
] as const;

describe("core API stability (v2.0 root contract)", () => {
  it("does not add root value exports without an explicit API review", () => {
    expect(Object.keys(core).sort()).toEqual([...ROOT_VALUE_EXPORTS_ALLOWLIST].sort());
  });

  it("stable root APIs exist", () => {
    expect(typeof core.createInspector).toBe("function");
    expect(typeof core.inspectRun).toBe("function");
    expect(typeof core.maybeInspectRun).toBe("function");
    expect(typeof core.getCurrentCorrelationMetadata).toBe("function");
    expect(typeof core.step).toBe("function");
    expect(typeof core.observe).toBe("function");
    expect(typeof core.step.llm).toBe("function");
    expect(typeof core.step.tool).toBe("function");
  });

  it("root contract types remain available to typecheck", () => {
    const stepType: core.StepType = "llm";
    const stepStatus: core.StepStatus = "success";
    const runStatus: core.RunStatus = "success";
    const errorInfo: core.ErrorInfo = { message: "fixture" };
    const tokenMetadata: core.TokenMetadata = { input: 1, output: 2, total: 3 };
    const stepMetadata: core.StepMetadata = { tokens: tokenMetadata };
    const redactionProfile: core.RedactionProfile = "strict";
    const inspectOptions: core.InspectRunOptions = { silent: true };
    const stepOptions: core.StepOptions = { type: "logic" };
    const observeOptions: core.ObserveOptions = { metadata: { fixture: true } };
    const correlation: core.TraceCorrelationMetadata = {
      correlationId: "corr_fixture",
    };
    const _run = null as unknown as core.Run;
    const _step = null as unknown as core.Step;
    const _createInspectorOptions =
      null as unknown as core.CreateInspectorOptions;
    const _inspector = null as unknown as core.Inspector;
    const _inspectorCaptureOptions =
      null as unknown as core.InspectorCaptureOptions;
    const _inspectorObserveOptions =
      null as unknown as core.InspectorObserveOptions;
    const _inspectorRunOptions = null as unknown as core.InspectorRunOptions;
    const _inspectorStepOptions = null as unknown as core.InspectorStepOptions;

    expect(stepType).toBe("llm");
    expect(stepStatus).toBe("success");
    expect(runStatus).toBe("success");
    expect(errorInfo.message).toBe("fixture");
    expect(stepMetadata.tokens?.total).toBe(3);
    expect(redactionProfile).toBe("strict");
    expect(inspectOptions.silent).toBe(true);
    expect(stepOptions.type).toBe("logic");
    expect(observeOptions.metadata?.fixture).toBe(true);
    expect(correlation.correlationId).toBe("corr_fixture");
    expect(_run).toBeNull();
    expect(_step).toBeNull();
    expect(_createInspectorOptions).toBeNull();
    expect(_inspector).toBeNull();
    expect(_inspectorCaptureOptions).toBeNull();
    expect(_inspectorObserveOptions).toBeNull();
    expect(_inspectorRunOptions).toBeNull();
    expect(_inspectorStepOptions).toBeNull();
  });

  it("advanced runtime and trace helpers live on the advanced subpath", () => {
    expect(typeof advanced.createInspectorRuntime).toBe("function");
    expect(typeof advanced.resolveTraceDir).toBe("function");
    expect(typeof advanced.readTraceEvents).toBe("function");
    expect(typeof advanced.buildRunWhatSummary).toBe("function");
    expect(typeof advanced.buildLocalExplanation).toBe("function");
    expect(typeof advanced.isAgentInspectEnabled).toBe("function");
    expect(typeof advanced.parseDuration).toBe("function");
    expect(typeof advanced.buildSessionIndex).toBe("function");
  });

  it("specialized surfaces live on documented subpaths", () => {
    expect(typeof writers.memoryWriter).toBe("function");
    expect(typeof writers.bufferedFileWriter).toBe("function");
    expect(typeof readers.openTrace).toBe("function");
    expect(typeof readers.readTrace).toBe("function");
    expect(typeof persisted.isPersistedInspectEvent).toBe("function");
    expect(typeof persisted.persistedInspectEventsToTraceEvents).toBe("function");
    expect(typeof logs.parseLogsToTrees).toBe("function");
    expect(typeof logs.Redactor).toBe("function");
    expect(typeof diff.diffTraceEvents).toBe("function");
    expect(typeof exporters.exportRunTree).toBe("function");
    expect(typeof exporters.buildRunReport).toBe("function");
    expect(typeof checks.runTraceChecks).toBe("function");
    expect(typeof reporters.createTraceArtifactManifest).toBe("function");
    expect(typeof reporters.createReporterArtifactPath).toBe("function");
    expect(typeof workspace.createWorkspace).toBe("function");
    expect(typeof workspace.createDefaultWorkspaceManifest).toBe("function");
    expect(typeof workspace.validateWorkspaceManifest).toBe("function");
    expect(typeof workspace.doctorWorkspace).toBe("function");
    expect(workspace.WORKSPACE_SCHEMA_VERSION).toBe("1.0");
  });
});
