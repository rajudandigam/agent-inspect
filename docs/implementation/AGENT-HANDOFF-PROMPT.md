# Agent handoff prompt (copy into a new Cursor chat)

Use when context is full or starting a fresh thread. Paste **everything inside the fenced block** as your first message.

---

```text
Continue the agent-inspect autonomous release train from a clean context window.

## Authority (read in this order only)

1. Git state on `main`
2. AGENTS.md
3. docs/implementation/RELEASE-TRAIN-STATE.md
4. docs/implementation/CURRENT-TASK.md
5. docs/implementation/release-trains/V6.1.0-EXECUTION-PLAN.md

Do NOT reread the full canonical roadmap unless architecture direction changes.

## Current state

- **Published:** agent-inspect @ **6.0.0** (all 18 packages on npm incl. @agent-inspect/studio)
- **Branch:** main
- **Completed:** v6.0.0 Self-hosted Studio
- **Next train:** v6.1.0 Client-hosted Ingestion
- **Next chunk:** v6.1-1 file-drop importer (v6.1-0 RFC done)

## Execution mode

autonomous-release-train — proceed through v6.1 → v6.4 without asking after each release unless a manual gate blocks.

After each version: implement → full validation gate → commit → changeset version → push → workflow_dispatch publish → update docs → continue.

## v6.1.0 goal (summary)

Extend @agent-inspect/studio with optional ingestion (file-drop, GitHub artifacts, HTTP+token, bundle upload). **Disabled by default.** Studio package only. No maintainer cloud.

RFC: docs/proposals/CLIENT-HOSTED-INGESTION-V6.1.md

## Remaining after v6.1

- v6.2.0 Plugin convention
- v6.3.0 MCP coding-agent workflows
- v6.4.0 Standards graduation

## Hard stops

- v7.0.0 — not scheduled
- HTTP ingest enabled by default (security review required)
- Force push, schema breaks, root dependency additions

## Start protocol

git status --short && git branch --show-current && git log -3 --oneline && git diff --check

Then implement v6.1-1 only. Report scope before editing. Run chunk gate. Update state docs. Continue autonomously unless manual gate hit.
```

---

## Maintainer context tips

- Start a **new chat** when context exceeds ~70%.
- Attach narrowly: CURRENT-TASK.md, V6.1.0-EXECUTION-PLAN.md, CLIENT-HOSTED-INGESTION-V6.1.md.
- Disable unrelated Cursor skills/MCP for release-train work.
