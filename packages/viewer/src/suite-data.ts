import path from "node:path";

import {
  buildRunTimeline,
  extractOutcomesFromTraceEvents,
  runSuite,
  type SuiteCaseResult,
  type SuiteRunResult,
} from "agent-inspect/advanced";
import { diffRuns, manualTraceEventsToComparableRun } from "agent-inspect/diff";
import { persistedInspectEventsToTraceEvents } from "agent-inspect/persisted";
import { openTrace } from "agent-inspect/readers";

export interface SuiteCaseViewerDetail {
  id: string;
  status: SuiteCaseResult["status"];
  tracePath?: string;
  runId?: string;
  message?: string;
  diagnostics: SuiteCaseResult["diagnostics"];
  timeline?: ReturnType<typeof buildRunTimeline>;
  toolPath: string[];
  observations: ReturnType<typeof extractOutcomesFromTraceEvents>;
  failureDiff?: {
    summary: ReturnType<typeof diffRuns>["summary"];
    differences: Array<{ kind: string; message: string }>;
  };
}

export interface SuiteViewerData {
  suiteName: string;
  configPath: string;
  tracesDir: string;
  ok: boolean;
  status: SuiteRunResult["status"];
  summary: SuiteRunResult["summary"];
  cases: SuiteCaseViewerDetail[];
  ciArtifactsDir?: string;
  bundleExportHint: string;
}

async function enrichCase(
  suiteCase: SuiteCaseResult,
  baselineTracePath?: string,
): Promise<SuiteCaseViewerDetail> {
  const base: SuiteCaseViewerDetail = {
    id: suiteCase.id,
    status: suiteCase.status,
    ...(suiteCase.tracePath !== undefined ? { tracePath: suiteCase.tracePath } : {}),
    ...(suiteCase.runId !== undefined ? { runId: suiteCase.runId } : {}),
    ...(suiteCase.message !== undefined ? { message: suiteCase.message } : {}),
    diagnostics: suiteCase.diagnostics,
    toolPath: [],
    observations: [],
  };

  if (suiteCase.tracePath === undefined) return base;

  try {
    const read = await openTrace({ type: "file", path: suiteCase.tracePath });
    const legacy = persistedInspectEventsToTraceEvents(read.events);
    const timeline = buildRunTimeline(legacy, { focus: "all" });
    const observations = extractOutcomesFromTraceEvents(legacy);
    const toolPath = timeline.entries
      .filter((entry) => entry.type === "tool")
      .map((entry) => entry.name);

    const detail: SuiteCaseViewerDetail = {
      ...base,
      timeline,
      toolPath,
      observations,
    };

    if (baselineTracePath !== undefined && suiteCase.status !== "pass") {
      try {
        const baselineRead = await openTrace({ type: "file", path: baselineTracePath });
        const diff = diffRuns(
          manualTraceEventsToComparableRun(
            persistedInspectEventsToTraceEvents(baselineRead.events),
          ),
          manualTraceEventsToComparableRun(legacy),
        );
        detail.failureDiff = {
          summary: diff.summary,
          differences: diff.differences.slice(0, 20).map((item) => ({
            kind: item.kind,
            message: item.message,
          })),
        };
      } catch {
        // Baseline diff is best-effort.
      }
    }

    return detail;
  } catch {
    return base;
  }
}

export async function loadSuiteViewerData(options: {
  suiteConfigPath?: string;
  cwd?: string;
}): Promise<SuiteViewerData> {
  const result = await runSuite({
    configPath: options.suiteConfigPath,
    cwd: options.cwd,
  });

  const baselineCase = result.cases.find((item) => item.status === "pass");
  const baselinePath = baselineCase?.tracePath;

  const cases: SuiteCaseViewerDetail[] = [];
  for (const suiteCase of result.cases) {
    cases.push(await enrichCase(suiteCase, baselinePath));
  }

  const artifactsDir = path.join(path.dirname(result.configPath), ".agent-inspect/suite-runs");

  return {
    suiteName: result.suiteName,
    configPath: result.configPath,
    tracesDir: result.tracesDir,
    ok: result.ok,
    status: result.status,
    summary: result.summary,
    cases,
    ciArtifactsDir: artifactsDir,
    bundleExportHint:
      "Export a share-safe bundle with: npx agent-inspect bundle <runId> --profile share",
  };
}
