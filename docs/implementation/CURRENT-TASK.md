# Current task

> **New chat handoff:** Copy the prompt from [AGENT-HANDOFF-PROMPT.md](./AGENT-HANDOFF-PROMPT.md) into a fresh Cursor thread to continue without carrying ~150K tokens of prior conversation.

```yaml
executionMode: autonomous-release-train
currentTrain: v6.0.0
trainStatus: ready
currentChunk: v6.0-1-scaffold
scope: Self-hosted Studio — then v6.1 → v6.4 (v7.0 NOT scheduled)
authority:
  - AGENTS.md
  - docs/implementation/release-trains/V6.0.0-EXECUTION-PLAN.md
  - docs/implementation/ROADMAP_V3_5_TO_V7.md (§ v6.0.0 only; do not reread full roadmap)
nextChunk: v6.0-1 Studio package scaffold
stopAfter: v6.4.0 published unless blocked by manual gate
```

## Published baseline (do not redo)

| Version | Theme | CI publish run |
|---------|-------|----------------|
| 5.1.0 | Cohort Analysis v2 (`agent-inspect cohort`) | 28988054272 |
| 5.2.0 | CI Quality Gates (`agent-inspect gate`) | 28990000097 |
| 5.3.0 | Suite Viewer (`agent-inspect viewer --suite/--workspace`) | 28991868139 |
| 5.4.0 | PM/QA suite templates (`suite init --template`) | 28993299414 |

All **17 linked packages** live on npm @ **5.4.0**. Git @ `d16a344` on `main`.

## Completed: v6.0-1 Studio package scaffold

`@agent-inspect/studio` — localhost server shell, `/api/health`, `agent-inspect studio` CLI (optional install).

## Next work: v6.0-2 workspace import + views

Run/session/suite/checks views per [V6.0.0-EXECUTION-PLAN.md](./release-trains/V6.0.0-EXECUTION-PLAN.md).

**Manual gates (stop and report, do not bypass):**

- First publication of `@agent-inspect/studio` (+ Trusted Publishing setup)
- VS Code Marketplace first publish (unchanged)
- Self-hosted auth / non-localhost binding — security review before default changes

## Remaining train after v6.0 (same autonomous mode)

- **v6.1.0** Client-hosted ingestion (studio extension, disabled by default)
- **v6.2.0** Plugin convention (`plugins list|doctor|validate`)
- **v6.3.0** MCP coding-agent workflows (extend `@agent-inspect/mcp-server`)
- **v6.4.0** Standards graduation (OTLP/OpenInference recipes; partial OTLP exists)
- **v7.0** — **DO NOT START** ([V7.0.0-READINESS-ASSESSMENT.md](./release-trains/V7.0.0-READINESS-ASSESSMENT.md))

## Context hygiene (for maintainer)

- Start **new chat** per major train or when context > ~70%
- Read only: this file, `RELEASE-TRAIN-STATE.md`, active execution plan, related source/tests
- Do not attach full roadmap or README unless a chunk requires it
- Disable unrelated Cursor skills/MCP for release-train work (outreach, Dev.to, etc.)
