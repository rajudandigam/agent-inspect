import { describe, expect, it } from "vitest";

import * as core from "../src/index.js";

describe("core API stability (v1.0 Pass 1)", () => {
  it("stable core APIs exist", () => {
    expect(typeof core.inspectRun).toBe("function");
    expect(typeof core.maybeInspectRun).toBe("function");
    expect(typeof core.isAgentInspectEnabled).toBe("function");
    expect(typeof core.getCurrentCorrelationMetadata).toBe("function");
    expect(typeof core.redactRunTreeForExport).toBe("function");
    expect(typeof core.resolveRedactionProfile).toBe("function");
    expect(typeof core.step).toBe("function");
    expect(typeof core.observe).toBe("function");
    expect(typeof (core.step as any).llm).toBe("function");
    expect(typeof (core.step as any).tool).toBe("function");
  });

  it("stable local inspection APIs exist", () => {
    expect(typeof core.TraceDirectory).toBe("function");
    expect(typeof core.resolveTraceDir).toBe("function");
    expect(typeof core.extractMetadata).toBe("function");
    expect(typeof core.buildRunSummary).toBe("function");
    expect(typeof core.filterTraces).toBe("function");
    expect(typeof core.buildRunTimeline).toBe("function");
    expect(typeof core.buildTraceStats).toBe("function");
    expect(typeof core.searchTraces).toBe("function");
    expect(typeof core.buildRunWhatSummary).toBe("function");
    expect(typeof core.renderRunWhat).toBe("function");
    expect(typeof core.buildRunReport).toBe("function");
    expect(typeof core.isAgentInspectTrace).toBe("function");
    expect(typeof core.parseDuration).toBe("function");
    expect(typeof core.formatDuration).toBe("function");
  });

  it("experimental-but-supported entry points still exist", () => {
    expect(typeof core.parseLogsToTrees).toBe("function");
    expect(typeof core.LiveLogAccumulator).toBe("function");
    expect(typeof core.exportRunTree).toBe("function");
    expect(typeof core.diffTraceEvents).toBe("function");
    expect(typeof core.createInspector).toBe("function");
    expect(typeof core.createInspectorRuntime).toBe("function");
    expect(typeof core.bufferedFileWriter).toBe("function");
    expect(typeof core.compositeWriter).toBe("function");
    expect(typeof core.fileWriter).toBe("function");
    expect(typeof core.memoryWriter).toBe("function");
    expect(typeof core.nullWriter).toBe("function");
    expect(typeof core.detectTraceFormat).toBe("function");
    expect(typeof core.openTrace).toBe("function");
    expect(typeof core.readTrace).toBe("function");
    expect(typeof core.TraceReadError).toBe("function");
  });

  it("key exported types remain available to typecheck", () => {
    const kind: core.InspectKind = "LLM";
    const confidence: core.AttributionConfidence = "explicit";
    // Value is never used at runtime; it only forces TS to resolve the types.
    const _typeWitness = null as unknown as core.InspectEvent &
      core.InspectRunTree &
      core.LogIngestConfig &
      core.RedactionRule;

    expect(kind).toBe("LLM");
    expect(confidence).toBe("explicit");
    expect(_typeWitness).toBeNull();
  });

  it("persisted-event surface is exported (v1.2.0 PR 2–3)", () => {
    expect(typeof core.isPersistedInspectEvent).toBe("function");
    expect(typeof core.traceEventToPersistedInspectEvent).toBe("function");
    expect(typeof core.traceEventsToPersistedInspectEvents).toBe("function");
    expect(typeof core.inspectEventToPersistedInspectEvent).toBe("function");
    expect(typeof core.inspectEventsToPersistedInspectEvents).toBe("function");
    expect(typeof core.persistedInspectEventToInspectEvent).toBe("function");
    expect(typeof core.persistedInspectEventsToInspectEvents).toBe("function");
    expect(typeof core.persistedInspectEventsToRunTrees).toBe("function");
    expect(typeof core.traceEventsToPersistedRunTrees).toBe("function");

    const _persistedTypeWitness =
      null as unknown as core.PersistedInspectEvent;
    const _persistedSourceTypeWitness =
      null as unknown as core.PersistedEventSourceType;
    const _persistedStatusWitness =
      null as unknown as core.PersistedEventStatus;
    const _traceOptsWitness =
      null as unknown as core.TraceEventToPersistedOptions;
    const _inspectOptsWitness =
      null as unknown as core.InspectEventToPersistedOptions;
    const _persistedToInspectOptsWitness =
      null as unknown as core.PersistedToInspectEventOptions;
    const _treeBridgeOptsWitness =
      null as unknown as core.PersistedTreeBridgeOptions;
    const _correlationWitness =
      null as unknown as core.TraceCorrelationMetadata;
    const _redactionProfileWitness = null as unknown as core.RedactionProfile;
    const _timelineWitness = null as unknown as core.RunTimeline;
    const _statsWitness = null as unknown as core.TraceStats;
    const _searchWitness = null as unknown as core.TraceSearchResult;
    const _inspectorRuntimeWitness = null as unknown as core.InspectorRuntime;
    const _inspectorRuntimeOptionsWitness =
      null as unknown as core.InspectorRuntimeOptions;
    const _inspectorWitness = null as unknown as core.Inspector;
    const _createInspectorOptionsWitness =
      null as unknown as core.CreateInspectorOptions;
    const _inspectorCaptureOptionsWitness =
      null as unknown as core.InspectorCaptureOptions;
    const _inspectorObserveOptionsWitness =
      null as unknown as core.InspectorObserveOptions;
    const _inspectorRunOptionsWitness =
      null as unknown as core.InspectorRunOptions;
    const _inspectorStepOptionsWitness =
      null as unknown as core.InspectorStepOptions;
    const _bufferedFileWriterOptionsWitness =
      null as unknown as core.BufferedFileWriterOptions;
    const _compositeWriterOptionsWitness =
      null as unknown as core.CompositeTraceWriterOptions;
    const _fileWriterOptionsWitness = null as unknown as core.FileTraceWriterOptions;
    const _writerWitness = null as unknown as core.TraceWriter;
    const _writerStatsWitness = null as unknown as core.TraceWriterStats;
    const _traceInputWitness = null as unknown as core.TraceInput;
    const _traceReaderWitness = null as unknown as core.TraceReader;
    const _traceReadOptionsWitness = null as unknown as core.TraceReadOptions;
    const _traceReadResultWitness = null as unknown as core.TraceReadResult;
    const _traceReadWarningWitness = null as unknown as core.TraceReadWarning;
    const _traceReadWarningSeverityWitness =
      null as unknown as core.TraceReadWarningSeverity;
    const _traceFormatCandidateWitness =
      null as unknown as core.TraceFormatCandidate;
    const _traceFormatDetectionStatusWitness =
      null as unknown as core.TraceFormatDetectionStatus;
    const _traceFormatDetectionResultWitness =
      null as unknown as core.TraceFormatDetectionResult;
    const _traceReaderDetectOptionsWitness =
      null as unknown as core.TraceReaderDetectOptions;
    const _traceReaderReadOptionsWitness =
      null as unknown as core.TraceReaderReadOptions;
    const _traceReadErrorCodeWitness =
      null as unknown as core.TraceReadErrorCode;

    expect(_persistedTypeWitness).toBeNull();
    expect(_persistedSourceTypeWitness).toBeNull();
    expect(_persistedStatusWitness).toBeNull();
    expect(_traceOptsWitness).toBeNull();
    expect(_inspectOptsWitness).toBeNull();
    expect(_persistedToInspectOptsWitness).toBeNull();
    expect(_treeBridgeOptsWitness).toBeNull();
    expect(_correlationWitness).toBeNull();
    expect(_redactionProfileWitness).toBeNull();
    expect(_timelineWitness).toBeNull();
    expect(_statsWitness).toBeNull();
    expect(_searchWitness).toBeNull();
    expect(_inspectorRuntimeWitness).toBeNull();
    expect(_inspectorRuntimeOptionsWitness).toBeNull();
    expect(_inspectorWitness).toBeNull();
    expect(_createInspectorOptionsWitness).toBeNull();
    expect(_inspectorCaptureOptionsWitness).toBeNull();
    expect(_inspectorObserveOptionsWitness).toBeNull();
    expect(_inspectorRunOptionsWitness).toBeNull();
    expect(_inspectorStepOptionsWitness).toBeNull();
    expect(_bufferedFileWriterOptionsWitness).toBeNull();
    expect(_compositeWriterOptionsWitness).toBeNull();
    expect(_fileWriterOptionsWitness).toBeNull();
    expect(_writerWitness).toBeNull();
    expect(_writerStatsWitness).toBeNull();
    expect(_traceInputWitness).toBeNull();
    expect(_traceReaderWitness).toBeNull();
    expect(_traceReadOptionsWitness).toBeNull();
    expect(_traceReadResultWitness).toBeNull();
    expect(_traceReadWarningWitness).toBeNull();
    expect(_traceReadWarningSeverityWitness).toBeNull();
    expect(_traceFormatCandidateWitness).toBeNull();
    expect(_traceFormatDetectionStatusWitness).toBeNull();
    expect(_traceFormatDetectionResultWitness).toBeNull();
    expect(_traceReaderDetectOptionsWitness).toBeNull();
    expect(_traceReaderReadOptionsWitness).toBeNull();
    expect(_traceReadErrorCodeWitness).toBeNull();
  });
});
