# Live issue batch 02 — OSS activation (post batch 01)

Prepared issue bodies for the **second wave** of public GitHub Issues. These are **not** live until a maintainer runs the creation script manually.

Batch 01 ([#7–#14](https://github.com/rajudandigam/agent-inspect/issues?q=is%3Aissue+is%3Aopen)) produced external contributions. Batch 02 continues contributor momentum with docs, fixtures, recipes, and design notes — keeping deep internals maintainer-owned.

## Files

| File | Title | Difficulty |
| ---- | ----- | ---------- |
| [001-add-first-pr-walkthrough.md](./001-add-first-pr-walkthrough.md) | Add first PR walkthrough for new contributors | Good first issue |
| [002-update-contributor-docs-with-live-issue-links.md](./002-update-contributor-docs-with-live-issue-links.md) | Update contributor docs with live issue links | Good first issue |
| [003-add-clean-install-smoke-test-guide.md](./003-add-clean-install-smoke-test-guide.md) | Add clean install smoke-test guide | Good first issue |
| [004-add-winston-structured-logging-recipe.md](./004-add-winston-structured-logging-recipe.md) | Add Winston structured logging recipe | Good first issue |
| [005-add-mcp-tool-call-trace-fixture.md](./005-add-mcp-tool-call-trace-fixture.md) | Add MCP tool-call trace fixture | Good first issue / intermediate |
| [006-add-vercel-ai-sdk-manual-instrumentation-recipe.md](./006-add-vercel-ai-sdk-manual-instrumentation-recipe.md) | Add Vercel AI SDK manual instrumentation recipe | Intermediate |
| [007-add-github-actions-trace-artifact-recipe.md](./007-add-github-actions-trace-artifact-recipe.md) | Add GitHub Actions trace artifact recipe | Intermediate |
| [008-add-phoenix-openinference-import-recipe.md](./008-add-phoenix-openinference-import-recipe.md) | Add Phoenix/OpenInference import recipe | Intermediate |
| [009-add-safe-trace-sharing-checklist.md](./009-add-safe-trace-sharing-checklist.md) | Add safe trace sharing checklist | Good first issue |
| [010-add-log-ingest-config-cookbook.md](./010-add-log-ingest-config-cookbook.md) | Add log ingest config cookbook | Good first issue |
| [011-add-multi-run-fixture-pack-for-stats.md](./011-add-multi-run-fixture-pack-for-stats.md) | Add multi-run fixture pack for future stats command | Intermediate |
| [012-add-langchain-persisted-trace-example.md](./012-add-langchain-persisted-trace-example.md) | Add LangChain persisted trace example | Intermediate |
| [013-add-vercel-ai-sdk-adapter-design-note.md](./013-add-vercel-ai-sdk-adapter-design-note.md) | Add Vercel AI SDK adapter design note | Design / help wanted |

## Recommended opening strategy

**Open now (good first / docs):** 001, 003, 004, 009, 010

**Open after targeted outreach:** 005, 006, 007, 008, 011, 012

**Design / help wanted (hold until feedback window):** 013

**Skip or defer:** 002 if batch 02 links were already updated in a prior PR — use only when new live numbers need linking.

## Maintainer steps

1. Review each issue body for accuracy after 1.1.0 and batch 01 learnings.
2. Confirm GitHub **labels** exist before running the script (create manually in GitHub UI — the script does not create labels).
3. Optionally create milestone **OSS Activation Batch 2** in GitHub UI (see `scripts/assign-batch-02-milestones.sh`).
4. Run `DRY_RUN=1 scripts/create-live-issues-batch-02.sh` first, then run without `DRY_RUN` to open issues.
5. Link live issue numbers in [GOOD-FIRST-ISSUES.md](../../GOOD-FIRST-ISSUES.md).

Do **not** open all 13 at once if active good-first issues already exceed ~15 — stagger per [MONTHLY-OSS-HYGIENE.md](../../docs/community/MONTHLY-OSS-HYGIENE.md).
