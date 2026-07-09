export const studioIndexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>AgentInspect Studio</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 1.5rem; line-height: 1.4; }
    h1 { font-size: 1.25rem; }
    .muted { color: #666; }
  </style>
</head>
<body>
  <h1>AgentInspect Studio</h1>
  <p class="muted">Self-hosted, read-only. JSONL and workspace manifests remain canonical.</p>
  <p id="status">Loading health…</p>
  <script>
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        document.getElementById("status").textContent =
          data.ok ? "Studio is running (read-only)." : "Studio health check failed.";
      })
      .catch(() => {
        document.getElementById("status").textContent = "Studio health check failed.";
      });
  </script>
</body>
</html>`;
