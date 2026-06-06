# Live issue batch 01 — post-1.1.0 activation

Prepared issue bodies for the first wave of **public GitHub Issues**. These are **not** live until a maintainer runs the creation script manually.

## Files

| File | Title | Difficulty |
| ---- | ----- | ---------- |
| [001-add-openinference-export-fixture.md](./001-add-openinference-export-fixture.md) | Add OpenInference export fixture | Good first issue |
| [002-improve-diff-cli-output-examples.md](./002-improve-diff-cli-output-examples.md) | Improve diff CLI output examples | Good first issue |
| [003-add-agentinspect-vs-production-observability-comparison.md](./003-add-agentinspect-vs-production-observability-comparison.md) | AgentInspect vs production observability comparison | Good first issue |
| [004-add-tool-failure-retry-fixture.md](./004-add-tool-failure-retry-fixture.md) | Add tool failure + retry fixture | Good first issue |
| [005-timeline-command-proposal.md](./005-timeline-command-proposal.md) | Timeline command proposal | Help wanted |
| [006-stats-command-proposal.md](./006-stats-command-proposal.md) | Stats command proposal | Help wanted |
| [007-decision-metadata-recipe.md](./007-decision-metadata-recipe.md) | Decision metadata recipe | Examples / docs |
| [008-persisted-langchain-streaming-design.md](./008-persisted-langchain-streaming-design.md) | Persisted LangChain streaming design | Maintainer-owned design |

## Maintainer steps

1. Review each issue body for accuracy after 1.1.0.
2. Confirm GitHub **labels** exist (batch 01 labels were created manually).
3. Enable **GitHub Discussions** in repo settings; pin stack survey per [docs/community/DISCUSSIONS-STARTERS.md](../../docs/community/DISCUSSIONS-STARTERS.md).
4. Run `scripts/create-live-issues-batch-01.sh` to open issues (review bodies first).
5. Link live issue numbers back in [GOOD-FIRST-ISSUES.md](../../GOOD-FIRST-ISSUES.md).

Do **not** bulk-convert all `.github/ISSUE_DRAFTS/` at once — ship this batch first, gather feedback, then plan batch 02.
