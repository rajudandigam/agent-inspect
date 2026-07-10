export const viewerIndexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>AgentInspect Viewer</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 1.5rem; line-height: 1.4; }
    h1 { font-size: 1.25rem; }
    pre { background: #f4f4f5; padding: 1rem; overflow: auto; max-height: 50vh; }
    a { color: #0b57d0; }
    .muted { color: #666; }
    table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
    th, td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; vertical-align: top; }
    th { background: #f6f6f6; }
    .fail { color: #b42318; font-weight: 600; }
    .pass { color: #027a48; font-weight: 600; }
    section { margin: 1.5rem 0; }
  </style>
</head>
<body>
  <h1>AgentInspect local viewer</h1>
  <p class="muted">Read-only. JSONL on disk remains canonical.</p>
  <p id="nav"></p>
  <div id="content"><pre id="out">Loading…</pre></div>
  <script>
    const params = new URLSearchParams(location.search);
    const mode = params.get("mode") || "traces";

    function escapeHtml(value) {
      return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
    }

    function renderSuite(data) {
      const rows = data.cases.map((c) =>
        '<tr><td>' + escapeHtml(c.id) + '</td><td class="' + escapeHtml(c.status) + '">' + escapeHtml(c.status) +
        '</td><td>' + escapeHtml(c.message || '') + '</td><td>' + escapeHtml(c.toolPath.join(' → ')) +
        '</td><td>' + escapeHtml(c.observations.map((o) => o.name + ':' + o.status).join(', ')) + '</td></tr>'
      ).join('');
      const failed = data.cases.filter((c) => c.status !== 'pass');
      const detail = failed.map((c) => {
        let html = '<h3>Case ' + escapeHtml(c.id) + '</h3><ul>';
        if (c.failureDiff) html += '<li>Diff errors: ' + escapeHtml(c.failureDiff.summary.errors) + '</li>';
        if (c.timeline) html += '<li>Timeline steps: ' + escapeHtml(c.timeline.entries.length) + '</li>';
        html += '<li>Diagnostics: ' + escapeHtml(c.diagnostics.map((d) => d.message).join('; ')) + '</li></ul>';
        return html;
      }).join('');
      return '<section><h2>Suite: ' + escapeHtml(data.suiteName) + ' (' + escapeHtml(data.status) + ')</h2>' +
        '<p>Passed ' + escapeHtml(data.summary.passed) + ', failed ' + escapeHtml(data.summary.failed) + '</p>' +
        '<table><thead><tr><th>Case</th><th>Status</th><th>Message</th><th>Tool path</th><th>Observations</th></tr></thead><tbody>' +
        rows + '</tbody></table>' +
        '<section><h2>Failure detail</h2>' + (detail || '<p class="pass">No failures</p>') + '</section>' +
        '<section><h2>CI artifacts</h2><p>' + escapeHtml(data.ciArtifactsDir || 'n/a') + '</p></section>' +
        '<section><h2>Bundle export</h2><p>' + escapeHtml(data.bundleExportHint) + '</p></section>';
    }

    async function load() {
      const nav = document.getElementById("nav");
      const out = document.getElementById("out");
      const content = document.getElementById("content");
      if (mode === "suite") {
        nav.innerHTML = '<a href="/api/suite">/api/suite</a>';
        const data = await fetch("/api/suite").then((r) => r.json());
        content.innerHTML = renderSuite(data);
        return;
      }
      if (mode === "workspace") {
        nav.innerHTML = '<a href="/api/workspace">/api/workspace</a>';
        const data = await fetch("/api/workspace").then((r) => r.json());
        content.innerHTML = '<section><h2>Workspace: ' + escapeHtml(data.project || 'workspace') + '</h2>' +
          '<p>Runs: ' + escapeHtml(data.runs.length) + '</p><pre>' + escapeHtml(JSON.stringify(data, null, 2)) + '</pre></section>';
        return;
      }
      nav.innerHTML = '<a href="/api/traces">/api/traces</a> · <a href="/api/sessions">/api/sessions</a>';
      const data = await fetch("/api/traces").then((r) => r.json());
      out.textContent = JSON.stringify(data, null, 2);
    }
    load().catch((err) => {
      document.getElementById("out").textContent = String(err);
    });
  </script>
</body>
</html>
`;
