# Good first issues (expanded)

Quick index: [GOOD-FIRST-ISSUES.md](../../GOOD-FIRST-ISSUES.md)

Historical drafts: [.github/ISSUE_DRAFTS/](../../.github/ISSUE_DRAFTS/)

**First live batch:** open on GitHub ([#7–#14](https://github.com/rajudandigam/agent-inspect/issues?q=is%3Aissue+is%3Aopen)). Source bodies: [.github/LIVE_ISSUE_BATCH_01/](../../.github/LIVE_ISSUE_BATCH_01/).

---

## First live issue batch

| Issue | Title | Labels | Source |
| - | ----- | ------ | ------ |
| [#7](https://github.com/rajudandigam/agent-inspect/issues/7) | Add OpenInference export fixture | good first issue, fixtures, exports, testing | [001](../../.github/LIVE_ISSUE_BATCH_01/001-add-openinference-export-fixture.md) |
| [#8](https://github.com/rajudandigam/agent-inspect/issues/8) | Improve diff CLI output examples | good first issue, documentation, cli, examples | [002](../../.github/LIVE_ISSUE_BATCH_01/002-improve-diff-cli-output-examples.md) |
| [#9](https://github.com/rajudandigam/agent-inspect/issues/9) | Add AgentInspect vs production observability comparison | good first issue, documentation, roadmap-now | [003](../../.github/LIVE_ISSUE_BATCH_01/003-add-agentinspect-vs-production-observability-comparison.md) |
| [#10](https://github.com/rajudandigam/agent-inspect/issues/10) | Add tool failure + retry fixture | good first issue, fixtures, examples | [004](../../.github/LIVE_ISSUE_BATCH_01/004-add-tool-failure-retry-fixture.md) |
| [#11](https://github.com/rajudandigam/agent-inspect/issues/11) | Timeline command proposal | help wanted, cli, roadmap-next | [005](../../.github/LIVE_ISSUE_BATCH_01/005-timeline-command-proposal.md) |
| [#12](https://github.com/rajudandigam/agent-inspect/issues/12) | Stats command proposal | help wanted, cli, roadmap-next | [006](../../.github/LIVE_ISSUE_BATCH_01/006-stats-command-proposal.md) |
| [#13](https://github.com/rajudandigam/agent-inspect/issues/13) | Decision metadata recipe | examples, documentation, roadmap-next | [007](../../.github/LIVE_ISSUE_BATCH_01/007-decision-metadata-recipe.md) |
| [#14](https://github.com/rajudandigam/agent-inspect/issues/14) | Persisted LangChain streaming design | langchain, adapter, roadmap-next, maintainer-owned | [008](../../.github/LIVE_ISSUE_BATCH_01/008-persisted-langchain-streaming-design.md) |

Related: [DISCUSSIONS-STARTERS.md](./DISCUSSIONS-STARTERS.md) · [OUTREACH-TEMPLATES.md](./OUTREACH-TEMPLATES.md) · [CONTRIBUTOR-ROLES.md](./CONTRIBUTOR-ROLES.md)

---

## Good first issue

Best for first-time contributors. **Docs, examples, fixtures, CLI output samples** — no changes to stable tracing defaults.

### Documentation

| # | Issue | Summary |
| - | ----- | ------- |
| 003 | [003-add-schema-version-faq.md](../../.github/ISSUE_DRAFTS/003-add-schema-version-faq.md) | FAQ for `schemaVersion: "0.1"` and evolution policy |
| 004 | [004-clarify-optional-tui-vs-live-tui.md](../../.github/ISSUE_DRAFTS/004-clarify-optional-tui-vs-live-tui.md) | Clarify `@agent-inspect/tui` vs `tail` / live log workflows |
| — | [#9](https://github.com/rajudandigam/agent-inspect/issues/9) | Expand comparison doc for production observability boundaries |

### Examples & recipes

**Shipped in 1.1.0:** pino, log4js, and NestJS logging recipes — see [LOGGING-PLAYBOOK.md](../LOGGING-PLAYBOOK.md) and `examples/recipes/`.

### Fixtures & CLI examples

| # | Issue | Summary |
| - | ----- | ------- |
| — | [#7](https://github.com/rajudandigam/agent-inspect/issues/7) | Fixture + test for OpenInference export |
| — | [#8](https://github.com/rajudandigam/agent-inspect/issues/8) | Document/sample `diff` CLI output |
| — | [#10](https://github.com/rajudandigam/agent-inspect/issues/10) | Fixture for tool failure and retry patterns |

**Tip:** Read [examples/recipes/README.md](../../examples/recipes/README.md) and [fixtures/README.md](../../fixtures/README.md) before starting recipes/fixtures.

---

## Intermediate

Requires reading core/CLI code and writing tests or design proposals.

| # | Issue | Summary |
| - | ----- | ------- |
| — | [#11](https://github.com/rajudandigam/agent-inspect/issues/11) | Proposed `timeline` CLI command |
| — | [#12](https://github.com/rajudandigam/agent-inspect/issues/12) | Proposed `stats` CLI command |
| — | [#13](https://github.com/rajudandigam/agent-inspect/issues/13) | Recipe for `decision` step metadata |
| 002 | [002-add-package-export-compatibility-tests.md](../../.github/ISSUE_DRAFTS/002-add-package-export-compatibility-tests.md) | CJS/ESM consumer smoke tests |
| 018 | [018-add-vitest-reporter-proposal.md](../../.github/ISSUE_DRAFTS/018-add-vitest-reporter-proposal.md) | Vitest reporter integration proposal |

---

## Maintainer-owned

Coordinate with maintainers **before** implementation. Affects stable APIs, storage, or published package layout.

| # | Issue / draft | Summary |
| - | ----- | ------- |
| — | [#14](https://github.com/rajudandigam/agent-inspect/issues/14) | LangChain streaming callbacks design — **maintainer-owned** |
| 001 | [001-fix-cjs-esm-conditional-type-exports.md](../../.github/ISSUE_DRAFTS/001-fix-cjs-esm-conditional-type-exports.md) | Conditional `types` exports for CJS/ESM — **implemented (1.1.0)** |
| 005 | [005-add-enabled-option-to-inspect-run.md](../../.github/ISSUE_DRAFTS/005-add-enabled-option-to-inspect-run.md) | `enabled` option on `inspectRun` — **implemented (1.1.0)** |
| 006 | [006-add-maybe-inspect-run-helper.md](../../.github/ISSUE_DRAFTS/006-add-maybe-inspect-run-helper.md) | `maybeInspectRun` convenience helper — **implemented (1.1.0)** |
| 007 | [007-redact-manual-metadata-before-disk.md](../../.github/ISSUE_DRAFTS/007-redact-manual-metadata-before-disk.md) | Redact manual trace metadata at write time — **implemented (1.1.0)** |
| 008 | [008-add-event-size-bounds.md](../../.github/ISSUE_DRAFTS/008-add-event-size-bounds.md) | Max event / metadata size guards — **implemented (1.1.0)** |
| 009 | [009-persist-langchain-callback-events.md](../../.github/ISSUE_DRAFTS/009-persist-langchain-callback-events.md) | LangChain → JSONL persistence — **implemented (1.1.0)** |

**Unified persisted event model** (manual JSONL + adapter events) is part of the design space for 009 and follow-on maintainer work — not a drive-by contributor change.

---

## Labels (suggested)

See final report in PR description for full label list. Common: `good first issue`, `documentation`, `enhancement`, `integration`, `maintainer-owned`, `packaging`, `security`, `cli`, `langchain`, `examples`, `fixtures`.
