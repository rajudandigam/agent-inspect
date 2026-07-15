# Good first issues

Curated entry points for contributors. Expanded notes: [docs/community/GOOD-FIRST-ISSUES.md](docs/community/GOOD-FIRST-ISSUES.md). First contributor PR flow: [docs/community/FIRST-PR-WALKTHROUGH.md](docs/community/FIRST-PR-WALKTHROUGH.md).

**Comment on a live issue before opening a PR.** AgentInspect is on the **6.7.3** pre-v7 adoption/evidence era: eighteen linked public packages, persisted schema 1.0. Preferred community work is correctness, portability, evidence, tests, fixtures, docs, and contributor experience — not new product surfaces.

## Find live work

The issue tracker is the source of truth; this file never supersedes it.

- [Ready community work](https://github.com/rajudandigam/agent-inspect/issues?q=is%3Aissue+is%3Aopen+label%3Acommunity-owned+label%3Astatus%3Aready) — `community-owned` + `status:ready`
- [Good first issues](https://github.com/rajudandigam/agent-inspect/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
- [All open issues](https://github.com/rajudandigam/agent-inspect/issues)

Before starting, read the issue's maintainer notes and check nobody has already claimed it in the comments.

## Good first (live)

| Issue | Title | Milestone |
| ----- | ----- | --------- |
| [#65](https://github.com/rajudandigam/agent-inspect/issues/65) | VS Code extension onboarding screenshots/GIF | Golden Path & Examples |
| [#67](https://github.com/rajudandigam/agent-inspect/issues/67) | Improve doctor troubleshooting messages | Contributor Experience — 2026 Q3 |
| [#151](https://github.com/rajudandigam/agent-inspect/issues/151) | Add external pilot feedback form and anonymized evidence template | External Pilot & Adoption |
| [#152](https://github.com/rajudandigam/agent-inspect/issues/152) | Sync pre-v7 pilot kit and adoption-evidence docs to 6.7.3 | External Pilot & Adoption |
| [#163](https://github.com/rajudandigam/agent-inspect/issues/163) | Add standards tested-version and known-loss consistency check | Standards Evidence |
| [#168](https://github.com/rajudandigam/agent-inspect/issues/168) | Add package README support-level and network-behavior consistency check | Contributor Experience — 2026 Q3 |

## Current milestones

| Milestone | Theme |
| --------- | ----- |
| External Pilot & Adoption | Pilot intake, retained CI evidence, Studio import walkthroughs |
| 6.7.3 — Correctness & Portability | Cross-platform packed-consumer evidence, SQLite matrix, writer corpus |
| Contributor Experience — 2026 Q3 | Templates, forms, docs hygiene, triage guides |
| Standards Evidence | OTLP/OpenInference preservation, Collector recipe, MCP protocol-state |
| Golden Path & Examples | Packed E2E, causal fixtures, Studio walkthroughs, adapter CI template |

## Also open (not all good-first)

| Issue | Notes |
| ----- | ----- |
| [#66](https://github.com/rajudandigam/agent-inspect/issues/66) | VS Code: open sample trace command (blocked) |
| [#100](https://github.com/rajudandigam/agent-inspect/issues/100) | CODEOWNERS (maintainer-owned) |
| [#115](https://github.com/rajudandigam/agent-inspect/issues/115) | ADPA recipe (design-partner gated) |

Full pre-v7 evidence batch: [#151](https://github.com/rajudandigam/agent-inspect/issues/151)–[#169](https://github.com/rajudandigam/agent-inspect/issues/169). See [docs/community/CREATED-OSS-ISSUES-6.7.3-02.md](docs/community/CREATED-OSS-ISSUES-6.7.3-02.md).

## Maintainer-owned (do not pick first)

Unified persisted event model, schema evolution, redaction/security internals, package export policy, official adapter internals, OTLP sink architecture, release process. See [docs/community/CONTRIBUTOR-ROLES.md](docs/community/CONTRIBUTOR-ROLES.md).

## Before you pick an issue

1. **Comment** on the live issue with your plan.
2. Read [CONTRIBUTING.md](CONTRIBUTING.md) validation commands.
3. **Redact** traces before sharing — [docs/SAFE-TRACE-SHARING.md](docs/SAFE-TRACE-SHARING.md).
4. No new root runtime dependencies, no Changesets, no version bumps.
5. Do **not** fabricate external pilot evidence or mark pre-v7 evidence rows complete.

Historical issue batches live under [docs/archive/github/](docs/archive/github/) and are reference-only.
