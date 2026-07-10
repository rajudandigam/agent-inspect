export const studioIndexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'unsafe-inline'; script-src 'unsafe-inline'" />
  <title>AgentInspect Studio</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; line-height: 1.4; color: #111; }
    header { padding: 1rem 1.5rem; border-bottom: 1px solid #ddd; background: #fafafa; }
    nav a { margin-right: 1rem; color: #0b57d0; text-decoration: none; }
    nav a.active { font-weight: 600; text-decoration: underline; }
    main { padding: 1.5rem; max-width: 1100px; }
    .muted { color: #666; }
    table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
    th, td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; vertical-align: top; }
    th { background: #f6f6f6; }
    pre { background: #f4f4f5; padding: 1rem; overflow: auto; max-height: 60vh; }
    .error { color: #b42318; }
  </style>
</head>
<body>
  <header>
    <h1>AgentInspect Studio</h1>
    <p class="muted">Self-hosted, read-only. SQLite only. JSONL remains canonical.</p>
    <nav id="nav">
      <a href="#projects" data-page="projects">Projects</a>
      <a href="#runs" data-page="runs">Runs</a>
      <a href="#sessions" data-page="sessions">Sessions</a>
      <a href="#suites" data-page="suites">Suites</a>
      <a href="#safety" data-page="safety">Safety</a>
      <a href="#imports" data-page="imports">Imports</a>
      <a href="#search" data-page="search">Search</a>
    </nav>
  </header>
  <main id="content"><p class="muted">Loading…</p></main>
  <script>
    function escapeHtml(value) {
      return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
    }

    let state = { projects: [], projectId: null };

    async function api(path) {
      const res = await fetch(path);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      return data;
    }

    function setPage(page) {
      document.querySelectorAll("#nav a").forEach((a) => {
        a.classList.toggle("active", a.dataset.page === page);
      });
    }

    function renderProjects() {
      setPage("projects");
      const rows = state.projects.map((p) =>
        '<tr><td><a href="#runs" data-select-project="' + escapeHtml(p.id) + '">' +
        escapeHtml(p.label || p.id) + '</a></td><td>' + escapeHtml(p.traceCount) +
        '</td><td>' + escapeHtml(p.path) + '</td></tr>'
      ).join("");
      document.getElementById("content").innerHTML =
        '<h2>Projects</h2><table><thead><tr><th>Project</th><th>Runs</th><th>Path</th></tr></thead><tbody>' +
        (rows || '<tr><td colspan="3">No projects imported</td></tr>') + '</tbody></table>';
      document.querySelectorAll("[data-select-project]").forEach((el) => {
        el.addEventListener("click", (ev) => {
          ev.preventDefault();
          state.projectId = el.getAttribute("data-select-project");
          location.hash = "runs";
          renderRuns();
        });
      });
    }

    async function renderRuns() {
      setPage("runs");
      if (!state.projectId && state.projects[0]) state.projectId = state.projects[0].id;
      if (!state.projectId) {
        document.getElementById("content").innerHTML = '<p>Select a project first.</p>';
        return;
      }
      const data = await api("/api/projects/" + encodeURIComponent(state.projectId) + "/runs");
      const rows = (data.runs || []).map((r) =>
        '<tr><td>' + escapeHtml(r.runId) + '</td><td>' + escapeHtml(r.status) +
        '</td><td>' + escapeHtml(r.name) + '</td><td>' + escapeHtml(r.durationMs) + '</td></tr>'
      ).join("");
      document.getElementById("content").innerHTML =
        '<h2>Runs — ' + escapeHtml(state.projectId) + '</h2>' +
        '<table><thead><tr><th>Run ID</th><th>Status</th><th>Name</th><th>Duration ms</th></tr></thead><tbody>' +
        rows + '</tbody></table>';
    }

    async function renderSimple(title, path) {
      setPage(title.toLowerCase());
      if (!state.projectId && state.projects[0]) state.projectId = state.projects[0].id;
      const data = await api("/api/projects/" + encodeURIComponent(state.projectId) + "/" + path);
      document.getElementById("content").innerHTML =
        '<h2>' + escapeHtml(title) + '</h2><pre>' + escapeHtml(JSON.stringify(data, null, 2)) + '</pre>';
    }

    async function renderImports() {
      setPage("imports");
      const health = await api("/api/health");
      document.getElementById("content").innerHTML =
        '<h2>Imports</h2><p>Registry: ' + escapeHtml(health.registryName) + '</p>' +
        '<pre>' + escapeHtml(JSON.stringify(health.warnings || [], null, 2)) + '</pre>';
    }

    async function renderSearch() {
      setPage("search");
      if (!state.projectId && state.projects[0]) state.projectId = state.projects[0].id;
      document.getElementById("content").innerHTML =
        '<h2>Search</h2><p><input id="q" placeholder="run id or name" /> <button id="go">Search</button></p><pre id="out"></pre>';
      document.getElementById("go").onclick = async () => {
        const q = document.getElementById("q").value;
        const data = await api("/api/search?projectId=" + encodeURIComponent(state.projectId) + "&q=" + encodeURIComponent(q));
        document.getElementById("out").textContent = JSON.stringify(data, null, 2);
      };
    }

    async function boot() {
      const health = await api("/api/health");
      const projects = await api("/api/projects");
      state.projects = projects.projects || health.projects || [];
      const page = (location.hash || "#projects").slice(1);
      if (page === "runs") return renderRuns();
      if (page === "sessions") return renderSimple("Sessions", "sessions");
      if (page === "suites") return renderSimple("Suites", "suites");
      if (page === "safety") return renderSimple("Safety", "redaction");
      if (page === "imports") return renderImports();
      if (page === "search") return renderSearch();
      return renderProjects();
    }

    window.addEventListener("hashchange", () => boot().catch(showError));
    function showError(err) {
      document.getElementById("content").innerHTML = '<p class="error">' + escapeHtml(String(err)) + '</p>';
    }
    boot().catch(showError);
  </script>
</body>
</html>`;
