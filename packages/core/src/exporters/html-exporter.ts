import type { InspectNode, InspectRunTree } from "../types/inspect-event.js";

import type { ExportOptions, ExportResult } from "./types.js";
import {
  compactAttributes,
  escapeHtml,
  flattenTree,
  safeString,
  stableJson,
} from "./helpers.js";

function renderTreeHtml(nodes: InspectNode[], ulClass = "tree"): string {
  if (nodes.length === 0) return "";
  const parts: string[] = [`<ul class="${ulClass}">`];
  for (const n of nodes) {
    const ev = n.event;
    const status = ev.status ?? "?";
    const dur =
      ev.durationMs !== undefined && Number.isFinite(ev.durationMs)
        ? `${ev.durationMs}ms`
        : "-";
    parts.push("<li>");
    parts.push(
      `<span class="nm">${escapeHtml(ev.name)}</span> <span class="meta">[${escapeHtml(ev.kind)}] ${escapeHtml(status)} (${escapeHtml(dur)})</span>`,
    );
    if (n.children.length > 0) {
      parts.push(renderTreeHtml(n.children, "tree nested"));
    }
    parts.push("</li>");
  }
  parts.push("</ul>");
  return parts.join("");
}

export function exportHtml(tree: InspectRunTree, options?: Partial<ExportOptions>): ExportResult {
  const warnings: string[] = [];
  const includeMetadata = options?.includeMetadata ?? true;
  const includeAttributes = options?.includeAttributes ?? false;
  const includeErrors = options?.includeErrors ?? true;
  const maxLen = options?.maxAttributeLength ?? 500;
  const redacted = options?.redacted ?? true;

  const titleName = escapeHtml(tree.name ?? tree.runId);

  const summaryRows: string[] = [];
  summaryRows.push(
    `<tr><th scope="row">runId</th><td><code>${escapeHtml(tree.runId)}</code></td></tr>`,
  );
  if (tree.name !== undefined) {
    summaryRows.push(`<tr><th scope="row">name</th><td>${escapeHtml(tree.name)}</td></tr>`);
  }
  summaryRows.push(
    `<tr><th scope="row">status</th><td>${escapeHtml(String(tree.status ?? "unknown"))}</td></tr>`,
  );
  summaryRows.push(
    `<tr><th scope="row">durationMs</th><td>${tree.durationMs !== undefined ? escapeHtml(String(tree.durationMs)) : "—"}</td></tr>`,
  );
  summaryRows.push(
    `<tr><th scope="row">startedAt</th><td>${tree.startedAt !== undefined ? escapeHtml(String(tree.startedAt)) : "—"}</td></tr>`,
  );
  summaryRows.push(
    `<tr><th scope="row">endedAt</th><td>${tree.endedAt !== undefined ? escapeHtml(String(tree.endedAt)) : "—"}</td></tr>`,
  );
  summaryRows.push(
    `<tr><th scope="row">totalEvents</th><td>${escapeHtml(String(tree.metadata.totalEvents))}</td></tr>`,
  );

  let confidenceHtml = "";
  if (includeMetadata) {
    const cb = tree.metadata.confidenceBreakdown;
    confidenceHtml += "<h3>Confidence breakdown</h3><table><thead><tr><th>bucket</th><th>count</th></tr></thead><tbody>";
    for (const k of Object.keys(cb).sort()) {
      const key = k as keyof typeof cb;
      confidenceHtml += `<tr><td>${escapeHtml(key)}</td><td>${cb[key]}</td></tr>`;
    }
    confidenceHtml += "</tbody></table>";

    confidenceHtml += "<h3>Kind breakdown</h3><table><thead><tr><th>kind</th><th>count</th></tr></thead><tbody>";
    for (const k of Object.keys(tree.metadata.kinds).sort()) {
      const key = k as keyof typeof tree.metadata.kinds;
      const c = tree.metadata.kinds[key];
      if (c > 0) confidenceHtml += `<tr><td>${escapeHtml(key)}</td><td>${c}</td></tr>`;
    }
    confidenceHtml += "</tbody></table>";
  }

  const flat = flattenTree(tree);
  const errors = flat.filter((n) => n.event.status === "error");
  let errorsHtml = "";
  if (includeErrors && errors.length > 0) {
    errorsHtml += "<h2>Errors</h2><ul>";
    for (const n of errors) {
      const msg =
        n.event.attributes && typeof n.event.attributes.error === "object"
          ? safeString(
              (n.event.attributes.error as { message?: string }).message,
              maxLen,
            )
          : "";
      errorsHtml += `<li><strong>${escapeHtml(n.event.name)}</strong> (${escapeHtml(n.event.eventId)}): ${escapeHtml(msg || "error")}</li>`;
    }
    errorsHtml += "</ul>";
  }

  let attrsHtml = "";
  if (includeAttributes) {
    attrsHtml += "<h2>Attributes (bounded)</h2>";
    for (const n of flat) {
      if (!n.event.attributes || Object.keys(n.event.attributes).length === 0) continue;
      const compact = compactAttributes(n.event.attributes, {
        maxLength: maxLen,
        redacted,
      });
      attrsHtml += `<h3>${escapeHtml(n.event.name)}</h3><pre class="json">${escapeHtml(stableJson(compact, true))}</pre>`;
    }
    warnings.push(
      "Attributes may still contain sensitive data; review exports before sharing.",
    );
  }

  const css = `
body{font-family:system-ui,sans-serif;line-height:1.5;margin:1.5rem;max-width:960px;color:#111}
h1{font-size:1.35rem}
h2{font-size:1.1rem;margin-top:1.5rem}
table{border-collapse:collapse;margin:0.75rem 0}
th,td{border:1px solid #ccc;padding:0.35rem 0.6rem;text-align:left}
th{background:#f5f5f5}
pre.json{background:#f8f8f8;padding:0.75rem;overflow:auto;font-size:0.85rem}
ul.tree{list-style:none;padding-left:1rem}
ul.tree.nested{padding-left:1.25rem;border-left:1px solid #ddd;margin:0.25rem 0}
.nm{font-weight:600}
.meta{color:#555;font-size:0.9rem}
footer{margin-top:2rem;font-size:0.85rem;color:#555}
`.trim();

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${titleName}</title>
<style>${css}</style>
</head>
<body>
<header><h1>AgentInspect Run: ${titleName}</h1></header>
<p class="note">Generated locally by AgentInspect.</p>
${includeMetadata ? `<section class="summary"><h2>Summary</h2><table>${summaryRows.join("")}</table>${confidenceHtml}</section>` : ""}
<section class="tree"><h2>Execution tree</h2>${tree.children.length > 0 ? renderTreeHtml(tree.children) : "<p>No steps recorded.</p>"}</section>
${errorsHtml}
${attrsHtml}
<footer>Generated locally by AgentInspect. Review for sensitive data before sharing.</footer>
</body>
</html>`;

  return {
    format: "html",
    content: html,
    contentType: "text/html",
    fileExtension: ".html",
    warnings,
  };
}
