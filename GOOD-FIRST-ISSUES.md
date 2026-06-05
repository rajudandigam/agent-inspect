# Good first issues

Curated entry points for contributors. Expanded notes live in [docs/community/GOOD-FIRST-ISSUES.md](docs/community/GOOD-FIRST-ISSUES.md).

Issue drafts (copy into GitHub when ready): [.github/ISSUE_DRAFTS/](.github/ISSUE_DRAFTS/)

---

## Good first issue

Documentation, examples, fixtures, and CLI output improvements — **no core tracing behavior changes**.

| Draft | Title | Area |
| ----- | ----- | ---- |
| [003](.github/ISSUE_DRAFTS/003-add-schema-version-faq.md) | Add schema version FAQ | docs |
| [004](.github/ISSUE_DRAFTS/004-clarify-optional-tui-vs-live-tui.md) | Clarify optional TUI vs live tail | docs |
| [014](.github/ISSUE_DRAFTS/014-add-openinference-export-fixture.md) | Add OpenInference export fixture | fixtures |
| [015](.github/ISSUE_DRAFTS/015-improve-diff-output-examples.md) | Improve diff CLI output examples | docs / CLI examples |
| [020](.github/ISSUE_DRAFTS/020-add-agentinspect-vs-production-observability-comparison.md) | AgentInspect vs production observability comparison | docs |

**Recently completed (v1.1 prep):** pino, log4js, and NestJS logging recipes — see [docs/LOGGING-PLAYBOOK.md](docs/LOGGING-PLAYBOOK.md) and `examples/recipes/`.

**Skills:** Markdown, TypeScript examples, reading existing `fixtures/` and `examples/recipes/` patterns.

---

## Intermediate

Design notes, compatibility tests, CLI proposals, and recipes that touch multiple packages or need careful scoping.

| Draft | Title | Area |
| ----- | ----- | ---- |
| [002](.github/ISSUE_DRAFTS/002-add-package-export-compatibility-tests.md) | Add package export compatibility tests | tests |
| [010](.github/ISSUE_DRAFTS/010-add-langchain-streaming-design-note.md) | LangChain streaming design note | docs / design |
| [016](.github/ISSUE_DRAFTS/016-add-timeline-command-proposal.md) | `timeline` command proposal | CLI design |
| [017](.github/ISSUE_DRAFTS/017-add-stats-command-proposal.md) | `stats` command proposal | CLI design |
| [018](.github/ISSUE_DRAFTS/018-add-vitest-reporter-proposal.md) | Vitest reporter proposal | integrations |
| [019](.github/ISSUE_DRAFTS/019-add-decision-metadata-recipe.md) | Decision metadata recipe | examples |

**Skills:** Vitest, CLI Commander patterns, reading `packages/core` and `packages/cli` without changing stable defaults casually.

---

## Maintainer-owned

Core API, schema, storage, and package export changes — coordinate in an issue before opening a PR.

| Draft | Title | Area | Status |
| ----- | ----- | ---- | ------ |
| [001](.github/ISSUE_DRAFTS/001-fix-cjs-esm-conditional-type-exports.md) | Fix CJS/ESM conditional type exports | packaging | Implemented (1.1.0) |
| [005](.github/ISSUE_DRAFTS/005-add-enabled-option-to-inspect-run.md) | Add `enabled` option to `inspectRun` | core API | Implemented (1.1.0) |
| [006](.github/ISSUE_DRAFTS/006-add-maybe-inspect-run-helper.md) | Add `maybeInspectRun` helper | core API | Implemented (1.1.0) |
| [007](.github/ISSUE_DRAFTS/007-redact-manual-metadata-before-disk.md) | Redact manual metadata before disk | security / storage | Implemented (1.1.0) |
| [008](.github/ISSUE_DRAFTS/008-add-event-size-bounds.md) | Add event size bounds | storage | Implemented (1.1.0) |
| [009](.github/ISSUE_DRAFTS/009-persist-langchain-callback-events.md) | Persist LangChain callback events to JSONL | langchain adapter | Implemented (1.1.0) |

**Why maintainer-owned:** affects stable v1.x contracts, `schemaVersion: "0.1"` compatibility, or published package layout. Drafts above are implemented pending conversion to closed GitHub issues.

---

## Before you pick an issue

1. Comment on the issue you want to work on.
2. For **maintainer-owned** items, wait for maintainer ack.
3. Read [CONTRIBUTING.md](CONTRIBUTING.md) validation commands for your PR type.
4. Do not add runtime dependencies without explicit approval.
