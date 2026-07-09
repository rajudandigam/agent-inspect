# Agent handoff prompt (copy into a new Cursor chat)

Use this when context is full or starting a fresh thread. Paste **everything inside the fenced block** as your first message.

---

```text
Continue the agent-inspect autonomous release train from a clean context window.

## Authority (read in this order only)

1. Git state on `main` (starting commit: 51838a2)
2. AGENTS.md (one-chunk protocol + validation gates)
3. docs/implementation/RELEASE-TRAIN-STATE.md
4. docs/implementation/CURRENT-TASK.md
5. docs/implementation/release-trains/V6.0.0-EXECUTION-PLAN.md

Do NOT reread the full canonical roadmap unless architecture direction changes.

## Current state

- **Published:** agent-inspect @ **5.4.0** (all 17 linked packages on npm)
- **Last publish CI:** 28993299414 (success)
- **Branch:** main @ 51838a2
- **Completed trains:** v5.1 cohort, v5.2 gate, v5.3 suite viewer, v5.4 suite templates
- **Next train:** v6.0.0 Self-hosted Studio
- **First chunk:** v6.0-0 Studio RFC (`docs/proposals/`)

## Execution mode

autonomous-release-train — proceed through v6.0 → v6.4 **without asking for confirmation after each release**, unless a manual gate blocks you.

After each version: implement → full validation gate → commit → changeset version → push main → workflow_dispatch publish → record publication in docs → continue.

## v6.0.0 goal (summary)

New optional package `@agent-inspect/studio`: `agent-inspect studio` as a **local/self-hosted read-only** analyzer over workspaces (SQLite default). Localhost by default. No maintainer cloud, no default upload, no write routes, no Postgres in root package.

See V6.0.0-EXECUTION-PLAN.md for ordered chunks v6.0-0 … v6.0-5.

## Remaining trains after v6.0

- v6.1.0 Client-hosted ingestion (studio; disabled by default)
- v6.2.0 Plugin convention (`plugins list|doctor|validate`)
- v6.3.0 MCP coding-agent workflows (extend mcp-server)
- v6.4.0 Standards graduation (OTLP/OpenInference recipes)

## Hard stops — do NOT start

- **v7.0.0** — conditional, not scheduled (see V7.0.0-READINESS-ASSESSMENT.md)
- First publish of `@agent-inspect/studio` without noting maintainer Trusted Publishing gate
- Force push, schema breaks, root dependency additions without approval

## MVP guardrails (unchanged)

- Local-first, CLI-first, no SQLite in core, no replay, no hosted SaaS
- Instrumentation must never break user agents
- Extend existing abstractions; no parallel systems

## Start protocol

```bash
git status --short && git branch --show-current && git log -3 --oneline && git diff --check
```

Then implement **v6.0-0** only (Studio RFC). Report scope, expected files, tests, and risks before editing. Run focused tests + chunk gate when done. Update CURRENT-TASK.md and RELEASE-TRAIN-STATE.md. Stop for review only if manual gate hit; otherwise continue to v6.0-1 after v6.0-0 is committed.
```

---

## Maintainer context tips

- Disable unrelated Cursor **skills** (outreach, Dev.to, Gmail, etc.) and unused **MCP** servers before starting.
- Attach files narrowly: `@CURRENT-TASK.md`, `@V6.0.0-EXECUTION-PLAN.md`, not the whole repo.
- Start a **new chat** again when context exceeds ~70% or after each major version publish.
