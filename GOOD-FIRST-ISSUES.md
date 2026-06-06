# Good first issues

Curated entry points for contributors. Expanded notes live in [docs/community/GOOD-FIRST-ISSUES.md](docs/community/GOOD-FIRST-ISSUES.md).

**Comment on an issue before opening a PR** — especially for help-wanted and maintainer-owned design items. Maintainers use comments to avoid duplicate work and to scope changes.

Historical issue drafts (source material only): [.github/ISSUE_DRAFTS/](.github/ISSUE_DRAFTS/) · batch 01 bodies: [.github/LIVE_ISSUE_BATCH_01/](.github/LIVE_ISSUE_BATCH_01/)

---

## Live issues

The first OSS issue batch is open on GitHub ([#7–#14](https://github.com/rajudandigam/agent-inspect/issues?q=is%3Aissue+is%3Aopen)). Pick a live issue below — not a draft file — then **comment** that you want to work on it before sending a PR.

| Issue | Title | Labels | Source |
| - | ----- | ------ | ------ |
| [#7](https://github.com/rajudandigam/agent-inspect/issues/7) | Add OpenInference export fixture | good first issue, fixtures, exports, testing | [001](.github/LIVE_ISSUE_BATCH_01/001-add-openinference-export-fixture.md) |
| [#8](https://github.com/rajudandigam/agent-inspect/issues/8) | Improve diff CLI output examples | good first issue, documentation, cli, examples | [002](.github/LIVE_ISSUE_BATCH_01/002-improve-diff-cli-output-examples.md) |
| [#9](https://github.com/rajudandigam/agent-inspect/issues/9) | Add AgentInspect vs production observability comparison | good first issue, documentation, roadmap-now | [003](.github/LIVE_ISSUE_BATCH_01/003-add-agentinspect-vs-production-observability-comparison.md) |
| [#10](https://github.com/rajudandigam/agent-inspect/issues/10) | Add tool failure + retry fixture | good first issue, fixtures, examples | [004](.github/LIVE_ISSUE_BATCH_01/004-add-tool-failure-retry-fixture.md) |
| [#11](https://github.com/rajudandigam/agent-inspect/issues/11) | Timeline command proposal | help wanted, cli, roadmap-next | [005](.github/LIVE_ISSUE_BATCH_01/005-timeline-command-proposal.md) |
| [#12](https://github.com/rajudandigam/agent-inspect/issues/12) | Stats command proposal | help wanted, cli, roadmap-next | [006](.github/LIVE_ISSUE_BATCH_01/006-stats-command-proposal.md) |
| [#13](https://github.com/rajudandigam/agent-inspect/issues/13) | Decision metadata recipe | examples, documentation, roadmap-next | [007](.github/LIVE_ISSUE_BATCH_01/007-decision-metadata-recipe.md) |
| [#14](https://github.com/rajudandigam/agent-inspect/issues/14) | Persisted LangChain streaming design | langchain, adapter, roadmap-next, maintainer-owned | [008](.github/LIVE_ISSUE_BATCH_01/008-persisted-langchain-streaming-design.md) |

**Activation rules:**

- **Do not open all** `.github/ISSUE_DRAFTS/` at once — ship batch 01, gather feedback, then plan batch 02.
- **Do not open** completed 1.1.0 work (CJS exports, `enabled` / `maybeInspectRun`, redaction, size bounds, LangChain persistence) as new active issues — close or reference as done.
- **Good first issues** = docs, examples, fixtures, CLI output samples — no core tracing default changes.
- **Maintainer-owned** issues (e.g. LangChain streaming **design**, unified InspectEvent) are **not** good-first issues — comment and wait for maintainer ack before substantial runtime work.

See [docs/community/DISCUSSIONS-STARTERS.md](docs/community/DISCUSSIONS-STARTERS.md), [docs/community/OUTREACH-TEMPLATES.md](docs/community/OUTREACH-TEMPLATES.md), [docs/community/CONTRIBUTOR-ROLES.md](docs/community/CONTRIBUTOR-ROLES.md), [docs/community/MONTHLY-OSS-HYGIENE.md](docs/community/MONTHLY-OSS-HYGIENE.md).

---

## Good first issues

Documentation, examples, fixtures, and CLI output improvements — **no core tracing behavior changes**.

| Issue | Title | Area |
| ----- | ----- | ---- |
| [#7](https://github.com/rajudandigam/agent-inspect/issues/7) | Add OpenInference export fixture | fixtures |
| [#8](https://github.com/rajudandigam/agent-inspect/issues/8) | Improve diff CLI output examples | docs / CLI examples |
| [#9](https://github.com/rajudandigam/agent-inspect/issues/9) | Add AgentInspect vs production observability comparison | docs |
| [#10](https://github.com/rajudandigam/agent-inspect/issues/10) | Add tool failure + retry fixture | fixtures |

**Shipped in 1.1.0:** pino, log4js, and NestJS logging recipes — see [docs/LOGGING-PLAYBOOK.md](docs/LOGGING-PLAYBOOK.md) and `examples/recipes/`.

**Skills:** Markdown, TypeScript examples, reading existing `fixtures/` and `examples/recipes/` patterns.

**Not live yet (draft only):** [003 schema FAQ](.github/ISSUE_DRAFTS/003-add-schema-version-faq.md), [004 optional TUI vs live tail](.github/ISSUE_DRAFTS/004-clarify-optional-tui-vs-live-tui.md).

---

## Help wanted / design

CLI proposals and recipes that touch multiple packages or need careful scoping. **Comment on the issue** before substantial work.

| Issue | Title | Area |
| ----- | ----- | ---- |
| [#11](https://github.com/rajudandigam/agent-inspect/issues/11) | Timeline command proposal | CLI design |
| [#12](https://github.com/rajudandigam/agent-inspect/issues/12) | Stats command proposal | CLI design |
| [#13](https://github.com/rajudandigam/agent-inspect/issues/13) | Decision metadata recipe | examples |

**Not live yet (draft only):** [002 package export compatibility tests](.github/ISSUE_DRAFTS/002-add-package-export-compatibility-tests.md), [018 Vitest reporter proposal](.github/ISSUE_DRAFTS/018-add-vitest-reporter-proposal.md).

**Skills:** Vitest, CLI Commander patterns, reading `packages/core` and `packages/cli` without changing stable defaults casually.

---

## Maintainer-owned design

Core API, schema, storage, and package export changes — **comment and wait for maintainer ack** before opening a PR.

| Issue / draft | Title | Area | Status |
| ----- | ----- | ---- | ------ |
| [#14](https://github.com/rajudandigam/agent-inspect/issues/14) | Persisted LangChain streaming design | langchain adapter | Open — design (maintainer-owned) |

**Implemented in 1.1.0 (historical drafts — do not reopen as active work):**

| Draft | Title | Area |
| ----- | ----- | ---- |
| [001](.github/ISSUE_DRAFTS/001-fix-cjs-esm-conditional-type-exports.md) | Fix CJS/ESM conditional type exports | packaging |
| [005](.github/ISSUE_DRAFTS/005-add-enabled-option-to-inspect-run.md) | Add `enabled` option to `inspectRun` | core API |
| [006](.github/ISSUE_DRAFTS/006-add-maybe-inspect-run-helper.md) | Add `maybeInspectRun` helper | core API |
| [007](.github/ISSUE_DRAFTS/007-redact-manual-metadata-before-disk.md) | Redact manual metadata before disk | security / storage |
| [008](.github/ISSUE_DRAFTS/008-add-event-size-bounds.md) | Add event size bounds | storage |
| [009](.github/ISSUE_DRAFTS/009-persist-langchain-callback-events.md) | Persist LangChain callback events to JSONL | langchain adapter |

**Why maintainer-owned:** affects stable v1.x contracts, `schemaVersion: "0.1"` compatibility, or published package layout. Unified persisted InspectEvent model, schema evolution, redaction internals, package exports, OTLP sink architecture, and v2 trace contract are maintainer-led — see [docs/community/GOOD-FIRST-ISSUES.md](docs/community/GOOD-FIRST-ISSUES.md#what-not-to-pick-first).

---

## Before you pick an issue

1. **Comment** on the live issue you want to work on — do not open a surprise PR.
2. For **help wanted / design** and **maintainer-owned** items, wait for maintainer ack.
3. Read [CONTRIBUTING.md](CONTRIBUTING.md) validation commands for your PR type.
4. Do not add runtime dependencies without explicit approval.
5. **Redact** traces and logs before sharing in issues, Discussions, or PRs — see [SECURITY.md](SECURITY.md).
