# IDE surfaces — decision record (v2.6.0)

**Status:** Deferred — no IDE extension in v2.6.0  
**Audience:** Maintainers, IDE integrators, design partners  
**Baseline:** `agent-inspect@2.6.0` (in progress)  
**Related:** [ADOPTION-METRICS.md](./product/ADOPTION-METRICS.md) · [LOCAL-VIEWER.md](./proposals/LOCAL-VIEWER.md) · [READ-ONLY-MCP-SERVER.md](./proposals/READ-ONLY-MCP-SERVER.md)

This document records the **v2.6.0 IDE surface decision**. AgentInspect remains **CLI-first** and **local-first**. Optional surfaces shipped in v2.6 address inspect-in-IDE workflows without a vendor-specific extension.

---

## 1. User stories (validated demand)

| Story | v2.6 answer | Notes |
| ----- | ----------- | ----- |
| Browse a trace tree in a browser on localhost | `agent-inspect serve` + `@agent-inspect/viewer` | Read-only HTTP; binds `127.0.0.1` by default |
| Let an IDE agent query local traces via MCP | `@agent-inspect/mcp-server` | Read-only tools; `share` redaction default |
| Instrument MCP **clients** from agent code | `@agent-inspect/mcp` (v2.4) | Client telemetry only — unchanged |
| Native Cursor/VS Code tree panel with installable extension | **Deferred** | No demand gate passed for extension work |
| Edit traces or invoke tools from IDE | **Out of scope** | Violates local inspection model |

---

## 2. Demand review (2026-06-04)

Evidence considered:

- v2.4 sessions + MCP **client** tracing shipped and documented.
- v2.5 guardrails/circuit utilities shipped for deterministic safety checks.
- v2.6 viewer + read-only MCP **server** implemented on `main` (commits through `688857c`).
- Adoption metrics show npm activity on root/adapters but **no sustained external requests** for a Cursor/VS Code marketplace extension.
- Existing workflows (`check`, `sessions`, `search`, eval, export) remain the primary retention signals.

Conclusion: **optional localhost viewer + read-only MCP server** satisfy inspect-in-IDE needs for v2.6 without committing to IDE marketplace maintenance.

---

## 3. Decision

**Defer a first-party IDE extension** until a post-v2.6 adoption review passes **all** of:

1. **Explicit demand:** ≥3 unrelated teams request IDE extension (issues, interviews, or design-partner notes) — not generic “better UI” feedback.
2. **Retention signal:** those teams already use CLI or v2.6 optional surfaces for 30+ days.
3. **Scope clarity:** requested extension is **read-only inspection** (tree, timeline, checks) — not trace mutation, replay, or auto-fix.
4. **Maintainer capacity:** extension CI (VSIX/Cursor packaging) fits release train without delaying core tracing work.

Until then:

- Document MCP server + viewer setup in recipes and CLI docs.
- Do **not** scaffold a visibility-only extension (no empty webview that duplicates `serve`).
- Revisit at v3.0+ adoption checkpoint or when demand gate criteria are met.

---

## 4. Integration guidance (no extension)

### Cursor / VS Code with MCP

Configure a local stdio MCP server pointing at `@agent-inspect/mcp-server` exports (`runReadOnlyMcpServer`) with `AGENT_INSPECT_TRACE_DIR` set. Tools are read-only; default redaction profile is `share`.

### Browser viewer

Run `agent-inspect serve` in the trace directory. Viewer is localhost-only and does not upload data.

### Terminal-first

`agent-inspect view`, `timeline`, `check`, and `sessions` remain the canonical surfaces for power users and CI.

---

## 5. Non-goals (unchanged)

- No IDE extension in v2.6.0.
- No automatic code edits from inspection tools.
- No hosted IDE backend or cloud trace sync.
- No coupling of root/core to IDE vendor SDKs.
