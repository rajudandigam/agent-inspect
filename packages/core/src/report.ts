import type { TraceEvent } from "./types.js";
import type { RedactionProfile } from "./types.js";
import type { InspectRunTree } from "./types/inspect-event.js";
import { exportHtml } from "./exporters/html-exporter.js";
import { exportMarkdown } from "./exporters/markdown-exporter.js";
import { escapeHtml, escapeMarkdown } from "./exporters/helpers.js";
import { manualTraceEventsToRunTree } from "./exporters/manual-trace-adapter.js";
import {
  redactRunTreeForExport,
  redactTraceEventsForReport,
} from "./exporters/redact-export.js";
import { buildRunTimeline, renderTimeline } from "./timeline.js";
import { buildRunWhatSummary, renderRunWhat } from "./what.js";
import {
  extractOutcomesFromTraceEvents,
  renderObservedOutcomesHtml,
  renderObservedOutcomesMarkdown,
  summarizeObservedOutcomes,
} from "./outcomes/index.js";

export type ReportFormat = "markdown" | "html";
export type ReportSection = "all" | "observations" | "what" | "timeline" | "tree";

export interface ReportOptions {
  format: ReportFormat;
  includeAttributes?: boolean;
  includeErrors?: boolean;
  redactionProfile?: RedactionProfile;
  /** Include correlation ids in the what section (default true). */
  correlation?: boolean;
  /** Limit output to one section (`observations` shows observed outcomes only). */
  section?: ReportSection;
}

export interface ReportResult {
  format: ReportFormat;
  content: string;
  contentType: string;
  fileExtension: string;
}

function resolveTree(
  events: TraceEvent[],
  profile: RedactionProfile,
): InspectRunTree {
  const tree = manualTraceEventsToRunTree(events);
  return profile === "local"
    ? tree
    : redactRunTreeForExport(tree, { redactionProfile: profile });
}

function tailMarkdownSection(content: string, heading: string): string {
  const marker = `## ${heading}`;
  const idx = content.indexOf(marker);
  if (idx < 0) return "";
  return content.slice(idx).trimEnd();
}

function extractHtmlFragment(content: string, start: string, end: string): string {
  const startIdx = content.indexOf(start);
  if (startIdx < 0) return "";
  const endIdx = content.indexOf(end, startIdx + start.length);
  if (endIdx < 0) return content.slice(startIdx);
  return content.slice(startIdx, endIdx);
}

const REPORT_HTML_CSS = `
body{font-family:system-ui,sans-serif;line-height:1.5;margin:1.5rem;max-width:960px;color:#111}
h1{font-size:1.35rem}
h2{font-size:1.1rem;margin-top:1.5rem}
pre{white-space:pre-wrap;background:#f8f8f8;padding:0.75rem;overflow:auto;font-size:0.9rem}
ul.tree{list-style:none;padding-left:1rem}
ul.tree.nested{padding-left:1.25rem;border-left:1px solid #ddd;margin:0.25rem 0}
.nm{font-weight:600}
.meta{color:#555;font-size:0.9rem}
footer{margin-top:2rem;font-size:0.85rem;color:#555}
`.trim();

/**
 * Build a local inspection report (markdown or HTML) from v0.1 trace events.
 * Composes `what`, timeline, and execution-tree sections.
 */
export function buildRunReport(
  events: TraceEvent[],
  options: ReportOptions,
): ReportResult {
  const profile = options.redactionProfile ?? "local";
  const section = options.section ?? "all";
  const safeEvents = redactTraceEventsForReport(events, {
    redactionProfile: profile,
  });
  const outcomes = summarizeObservedOutcomes(
    extractOutcomesFromTraceEvents(safeEvents),
  );
  const observationsMarkdown = renderObservedOutcomesMarkdown(outcomes);
  const observationsHtml = renderObservedOutcomesHtml(outcomes);

  if (section === "observations") {
    if (options.format === "markdown") {
      return {
        format: "markdown",
        content: `## Observed outcomes\n\n${observationsMarkdown}\n`,
        contentType: "text/markdown",
        fileExtension: ".md",
      };
    }
    return {
      format: "html",
      content: `<!doctype html><html lang="en"><head><meta charset="utf-8"/><title>Observed outcomes</title><style>${REPORT_HTML_CSS}</style></head><body><h1>Observed outcomes</h1>${observationsHtml}</body></html>`,
      contentType: "text/html",
      fileExtension: ".html",
    };
  }

  const whatSummary = buildRunWhatSummary(safeEvents);
  const whatText = renderRunWhat(whatSummary, {
    correlation: options.correlation !== false,
  });
  const timelineText = renderTimeline(buildRunTimeline(safeEvents));
  const tree = resolveTree(safeEvents, profile);

  const exportOpts = {
    includeMetadata: false,
    includeAttributes: options.includeAttributes === true,
    includeErrors: options.includeErrors !== false,
    redacted: true,
    redactionProfile: profile,
    maxAttributeLength: 500,
  };

  if (options.format === "markdown") {
    const treeMd = exportMarkdown(tree, exportOpts);
    const tail = tailMarkdownSection(treeMd.content, "Execution tree");
    const title = escapeMarkdown(whatSummary.name ?? whatSummary.runId);
    const lines = [
      `# AgentInspect Report: ${title}`,
      "",
      "Generated locally by AgentInspect. Review for sensitive data before sharing.",
      "",
      "## What happened",
      "",
      "```text",
      whatText,
      "```",
      "",
      "## Timeline",
      "",
      "```text",
      timelineText,
      "```",
      "",
      "## Observed outcomes",
      "",
      observationsMarkdown,
      "",
    ];
    if (tail) {
      lines.push(tail, "");
    } else {
      lines.push("## Execution tree", "", "(no steps)", "");
    }

    return {
      format: "markdown",
      content: lines.join("\n"),
      contentType: "text/markdown",
      fileExtension: ".md",
    };
  }

  const treeHtml = exportHtml(tree, exportOpts);
  const title = escapeHtml(whatSummary.name ?? whatSummary.runId);
  const treeSection = extractHtmlFragment(
    treeHtml.content,
    '<section class="tree">',
    "</section>",
  );
  // The exporter emits Errors before Attributes, so the errors fragment must
  // stop at the attributes heading when both sections are present; ending at
  // <footer> would swallow the attributes section and duplicate it below.
  const errorsSectionEnd = treeHtml.content.includes(
    "<h2>Attributes (bounded)</h2>",
  )
    ? "<h2>Attributes (bounded)</h2>"
    : "<footer>";
  const errorsSection = treeHtml.content.includes("<h2>Errors</h2>")
    ? extractHtmlFragment(treeHtml.content, "<h2>Errors</h2>", errorsSectionEnd)
    : "";
  const attrsSection = treeHtml.content.includes("<h2>Attributes (bounded)</h2>")
    ? extractHtmlFragment(
        treeHtml.content,
        "<h2>Attributes (bounded)</h2>",
        "<footer>",
      )
    : "";

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>AgentInspect Report: ${title}</title>
<style>${REPORT_HTML_CSS}</style>
</head>
<body>
<header><h1>AgentInspect Report: ${title}</h1></header>
<p class="note">Generated locally by AgentInspect. Review for sensitive data before sharing.</p>
<section class="what"><h2>What happened</h2><pre>${escapeHtml(whatText)}</pre></section>
<section class="timeline"><h2>Timeline</h2><pre>${escapeHtml(timelineText)}</pre></section>
<section class="observations"><h2>Observed outcomes</h2>${observationsHtml}</section>
${treeSection || "<section class=\"tree\"><h2>Execution tree</h2><p>No steps recorded.</p></section>"}
${errorsSection}
${attrsSection}
<footer>Generated locally by AgentInspect. Review for sensitive data before sharing.</footer>
</body>
</html>`;

  return {
    format: "html",
    content: html,
    contentType: "text/html",
    fileExtension: ".html",
  };
}
