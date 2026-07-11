# Good first issues

Curated entry points for contributors. Expanded notes: [docs/community/GOOD-FIRST-ISSUES.md](docs/community/GOOD-FIRST-ISSUES.md). First contributor PR flow: [docs/community/FIRST-PR-WALKTHROUGH.md](docs/community/FIRST-PR-WALKTHROUGH.md).

**Comment on a live issue before opening a PR.** AgentInspect is on the **6.7.2 adoption freeze**: eighteen linked public packages, persisted schema 1.0, and freeze-allowed work is correctness, portability, tests, fixtures, docs, and contributor experience — not new product surfaces.

## Find live work

The issue tracker is the source of truth; this file never supersedes it.

- [Ready community work](https://github.com/rajudandigam/agent-inspect/issues?q=is%3Aissue+is%3Aopen+label%3Acommunity-owned+label%3Astatus%3Aready) — `community-owned` + `status:ready`
- [Good first issues](https://github.com/rajudandigam/agent-inspect/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
- [All open issues](https://github.com/rajudandigam/agent-inspect/issues)

Before starting, read the issue's maintainer notes and check nobody has already claimed it in the comments.

## Current milestones

| Milestone | Theme |
| --------- | ----- |
| 6.7.3 — Correctness & Portability | Cross-platform fixes, parity tests, regression corpora |
| Contributor Experience — 2026 Q3 | Templates, forms, docs hygiene, triage guides |
| Standards Evidence | OpenInference/OTLP fixtures, MCP privacy coverage |
| Golden Path & Examples | Walkthroughs, recipes, Studio/viewer polish |

## Maintainer-owned (do not pick first)

Unified persisted event model, schema evolution, redaction/security internals, package export policy, official adapter internals, OTLP sink architecture, release process. See [docs/community/CONTRIBUTOR-ROLES.md](docs/community/CONTRIBUTOR-ROLES.md).

## Before you pick an issue

1. **Comment** on the live issue with your plan.
2. Read [CONTRIBUTING.md](CONTRIBUTING.md) validation commands.
3. **Redact** traces before sharing — [docs/SAFE-TRACE-SHARING.md](docs/SAFE-TRACE-SHARING.md).
4. No new root runtime dependencies, no Changesets, no version bumps.

Historical issue batches live under [docs/archive/github/](docs/archive/github/) and are reference-only.
