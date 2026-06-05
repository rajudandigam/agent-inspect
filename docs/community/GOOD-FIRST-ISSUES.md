# Good first issues (expanded)

Quick index: [GOOD-FIRST-ISSUES.md](../../GOOD-FIRST-ISSUES.md)

Issue drafts live in [.github/ISSUE_DRAFTS/](../../.github/ISSUE_DRAFTS/). Maintainers copy a draft into GitHub Issues when ready to triage.

---

## Good first issue

Best for first-time contributors. **Docs, examples, fixtures, CLI output samples** — no changes to stable tracing defaults.

### Documentation

| # | Draft | Summary |
| - | ----- | ------- |
| 003 | [003-add-schema-version-faq.md](../../.github/ISSUE_DRAFTS/003-add-schema-version-faq.md) | FAQ for `schemaVersion: "0.1"` and evolution policy |
| 004 | [004-clarify-optional-tui-vs-live-tui.md](../../.github/ISSUE_DRAFTS/004-clarify-optional-tui-vs-live-tui.md) | Clarify `@agent-inspect/tui` vs `tail` / live log workflows |
| 020 | [020-add-agentinspect-vs-production-observability-comparison.md](../../.github/ISSUE_DRAFTS/020-add-agentinspect-vs-production-observability-comparison.md) | Expand comparison doc for production observability boundaries |

### Examples & recipes

**Completed (v1.1 prep):** pino, log4js, and NestJS logging recipes — see [LOGGING-PLAYBOOK.md](../LOGGING-PLAYBOOK.md) and `examples/recipes/`.

### Fixtures & CLI examples

| # | Draft | Summary |
| - | ----- | ------- |
| 014 | [014-add-openinference-export-fixture.md](../../.github/ISSUE_DRAFTS/014-add-openinference-export-fixture.md) | Fixture + test for OpenInference export |
| 015 | [015-improve-diff-output-examples.md](../../.github/ISSUE_DRAFTS/015-improve-diff-output-examples.md) | Document/sample `diff` CLI output |

**Tip:** Read [examples/recipes/README.md](../../examples/recipes/README.md) and [fixtures/README.md](../../fixtures/README.md) before starting recipes/fixtures.

---

## Intermediate

Requires reading core/CLI code and writing tests or design proposals.

| # | Draft | Summary |
| - | ----- | ------- |
| 002 | [002-add-package-export-compatibility-tests.md](../../.github/ISSUE_DRAFTS/002-add-package-export-compatibility-tests.md) | CJS/ESM consumer smoke tests |
| 010 | [010-add-langchain-streaming-design-note.md](../../.github/ISSUE_DRAFTS/010-add-langchain-streaming-design-note.md) | Streaming callbacks design doc |
| 016 | [016-add-timeline-command-proposal.md](../../.github/ISSUE_DRAFTS/016-add-timeline-command-proposal.md) | Proposed `timeline` CLI command |
| 017 | [017-add-stats-command-proposal.md](../../.github/ISSUE_DRAFTS/017-add-stats-command-proposal.md) | Proposed `stats` CLI command |
| 018 | [018-add-vitest-reporter-proposal.md](../../.github/ISSUE_DRAFTS/018-add-vitest-reporter-proposal.md) | Vitest reporter integration proposal |
| 019 | [019-add-decision-metadata-recipe.md](../../.github/ISSUE_DRAFTS/019-add-decision-metadata-recipe.md) | Recipe for `decision` step metadata |

---

## Maintainer-owned

Coordinate with maintainers **before** implementation. Affects stable APIs, storage, or published package layout.

| # | Draft | Summary |
| - | ----- | ------- |
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
