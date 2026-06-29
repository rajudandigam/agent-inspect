export const viewerIndexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>AgentInspect Viewer</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 1.5rem; line-height: 1.4; }
    h1 { font-size: 1.25rem; }
    pre { background: #f4f4f5; padding: 1rem; overflow: auto; max-height: 70vh; }
    a { color: #0b57d0; }
    .muted { color: #666; }
  </style>
</head>
<body>
  <h1>AgentInspect local viewer</h1>
  <p class="muted">Read-only. JSONL on disk remains canonical.</p>
  <p><a href="/api/health">/api/health</a> · <a href="/api/traces">/api/traces</a> · <a href="/api/sessions">/api/sessions</a></p>
  <pre id="out">Loading traces…</pre>
  <script>
    fetch("/api/traces").then((r) => r.json()).then((data) => {
      document.getElementById("out").textContent = JSON.stringify(data, null, 2);
    }).catch((err) => {
      document.getElementById("out").textContent = String(err);
    });
  </script>
</body>
</html>
`;
