# Good first issues (expanded)

Quick index: [GOOD-FIRST-ISSUES.md](../../GOOD-FIRST-ISSUES.md)

Historical drafts (source material only): [.github/ISSUE_DRAFTS/](../../.github/ISSUE_DRAFTS/) · batch 01 bodies: [.github/LIVE_ISSUE_BATCH_01/](../../.github/LIVE_ISSUE_BATCH_01/)

---

## Live issues

The first OSS issue batch is open ([#7–#14](https://github.com/rajudandigam/agent-inspect/issues?q=is%3Aissue+is%3Aopen)). Use the GitHub links below — not draft files — when picking work.

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

## How to pick an issue

1. Start from a **live issue** ([#7–#14](https://github.com/rajudandigam/agent-inspect/issues?q=is%3Aissue+is%3Aopen)) — especially [#7](https://github.com/rajudandigam/agent-inspect/issues/7)–[#10](https://github.com/rajudandigam/agent-inspect/issues/10) for first-time contributors.
2. **Comment** on the issue with your intent before opening a PR (e.g. “I’d like to take this — plan is …”).
3. Read the linked batch body or draft for scope; match existing patterns in `fixtures/`, `examples/recipes/`, or `docs/`.
4. Run the validation commands in [CONTRIBUTING.md](../../CONTRIBUTING.md) for your change type.
5. Open a focused PR referencing the issue number. Do not add runtime dependencies without maintainer approval.
6. For open-ended ideas, use [GitHub Discussions](https://github.com/rajudandigam/agent-inspect/discussions) first — maintainers map feedback to [ROADMAP.md](../../ROADMAP.md).

---

## What not to pick first

These areas are **maintainer-led** or affect stable v1.x contracts. Docs/fixtures that support design are welcome when scoped in a live issue; **do not drive-by change core behavior** without coordination.

| Area | Why |
| ---- | --- |
| **Unified persisted InspectEvent model** | Aligning manual JSONL and adapter-persisted events — core schema/design space for ~v1.2.0 |
| **Schema evolution** | `schemaVersion: "0.1"` compatibility and migration policy |
| **Redaction / security internals** | Default redaction, size bounds, and write-path safety — shipped in 1.1.0; changes need security review |
| **Package exports** | CJS/ESM conditional `types`, published layout, consumer smoke contracts |
| **OTLP sink architecture** | Future opt-in HTTP sink — not a default upload pipeline; design before code |
| **v2 trace contract** | Major-version evolution — requires migration guide and explicit scope approval |

If you are unsure, comment on a live issue or ask in Discussions before investing in a large PR.

---

## Good first issues

Best for first-time contributors. **Docs, examples, fixtures, CLI output samples** — no changes to stable tracing defaults.

### Documentation

| Issue | Summary |
| ----- | ------- |
| [#9](https://github.com/rajudandigam/agent-inspect/issues/9) | Expand comparison doc for production observability boundaries |

**Draft only (not live):** [003 schema FAQ](../../.github/ISSUE_DRAFTS/003-add-schema-version-faq.md), [004 optional TUI vs live tail](../../.github/ISSUE_DRAFTS/004-clarify-optional-tui-vs-live-tui.md).

### Examples & recipes

**Shipped in 1.1.0:** pino, log4js, and NestJS logging recipes — see [LOGGING-PLAYBOOK.md](../LOGGING-PLAYBOOK.md) and `examples/recipes/`.

### Fixtures & CLI examples

| Issue | Summary |
| ----- | ------- |
| [#7](https://github.com/rajudandigam/agent-inspect/issues/7) | Fixture + test for OpenInference export |
| [#8](https://github.com/rajudandigam/agent-inspect/issues/8) | Document/sample `diff` CLI output |
| [#10](https://github.com/rajudandigam/agent-inspect/issues/10) | Fixture for tool failure and retry patterns |

**Tip:** Read [examples/recipes/README.md](../../examples/recipes/README.md) and [fixtures/README.md](../../fixtures/README.md) before starting recipes/fixtures.

---

## Help wanted / design

Requires reading core/CLI code and writing tests or design proposals. **Comment before substantial work.**

| Issue | Summary |
| ----- | ------- |
| [#11](https://github.com/rajudandigam/agent-inspect/issues/11) | Proposed `timeline` CLI command |
| [#12](https://github.com/rajudandigam/agent-inspect/issues/12) | Proposed `stats` CLI command |
| [#13](https://github.com/rajudandigam/agent-inspect/issues/13) | Recipe for `decision` step metadata |

**Draft only (not live):** [002 package export compatibility tests](../../.github/ISSUE_DRAFTS/002-add-package-export-compatibility-tests.md), [018 Vitest reporter proposal](../../.github/ISSUE_DRAFTS/018-add-vitest-reporter-proposal.md).

---

## Maintainer-owned design

Coordinate with maintainers **before** implementation. Affects stable APIs, storage, or published package layout.

| Issue / draft | Summary |
| ----- | ------- |
| [#14](https://github.com/rajudandigam/agent-inspect/issues/14) | LangChain streaming callbacks design — **maintainer-owned** |

**Implemented in 1.1.0 (historical drafts):** [001](../../.github/ISSUE_DRAFTS/001-fix-cjs-esm-conditional-type-exports.md), [005](../../.github/ISSUE_DRAFTS/005-add-enabled-option-to-inspect-run.md), [006](../../.github/ISSUE_DRAFTS/006-add-maybe-inspect-run-helper.md), [007](../../.github/ISSUE_DRAFTS/007-redact-manual-metadata-before-disk.md), [008](../../.github/ISSUE_DRAFTS/008-add-event-size-bounds.md), [009](../../.github/ISSUE_DRAFTS/009-persist-langchain-callback-events.md).

---

## Labels (reference)

Common labels on live issues: `good first issue`, `documentation`, `help wanted`, `cli`, `examples`, `fixtures`, `exports`, `testing`, `roadmap-now`, `roadmap-next`, `langchain`, `adapter`, `maintainer-owned`.
