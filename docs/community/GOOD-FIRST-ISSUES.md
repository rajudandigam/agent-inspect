# Good first issues (expanded)

Quick index: [GOOD-FIRST-ISSUES.md](../../GOOD-FIRST-ISSUES.md)

The live issue tracker is the source of truth. Use GitHub `#NNN` links — not archived draft markdown under [docs/archive/github/](../../docs/archive/github/).

---

## How to find live work

- [`community-owned` + `status:ready`](https://github.com/rajudandigam/agent-inspect/issues?q=is%3Aissue+is%3Aopen+label%3Acommunity-owned+label%3Astatus%3Aready) — vetted, unblocked, freeze-compatible
- [`good first issue`](https://github.com/rajudandigam/agent-inspect/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) — smallest scoped entries
- Filter further by area label: `area:core`, `area:cli`, `area:logs`, `area:mcp`, `area:index`, `area:studio`, `area:viewer`, `area:community`, `area:release`

Every issue lists its contribution lane, difficulty, priority, acceptance criteria, and validation commands. Check the comments for maintainer notes and existing claims before starting.

## Current milestones and what they want

| Milestone | Typical work |
| --------- | ------------ |
| **6.7.3 — Correctness & Portability** | Windows/POSIX portability, index-versus-scan parity, malformed-input corpora, exit-code and JSON determinism regression tests |
| **Contributor Experience — 2026 Q3** | Issue forms, PR template, docs hygiene checks, triage and ownership guides |
| **Standards Evidence** | OpenInference/OTLP export goldens, MCP privacy/adversarial fixtures, graduation guides |
| **Golden Path & Examples** | Persisted-trace walkthroughs, recipes, Studio/viewer onboarding and accessibility |

## How to pick an issue

1. Start from a live issue in one of the queries above.
2. **Comment** on the issue with your plan before opening a PR.
3. Match patterns in `fixtures/`, `examples/recipes/`, or `docs/` — extend existing layouts rather than inventing parallel ones.
4. Run the validation commands from [CONTRIBUTING.md](../../CONTRIBUTING.md) (docs changes also run `pnpm docs:check`).
5. Open a focused PR referencing the issue number. One concern per PR.

Related: [DISCUSSIONS-STARTERS.md](./DISCUSSIONS-STARTERS.md) · [OUTREACH-TEMPLATES.md](./OUTREACH-TEMPLATES.md) · [CONTRIBUTOR-ROLES.md](./CONTRIBUTOR-ROLES.md)

---

## What not to pick first

| Area | Why |
| ---- | --- |
| **Unified persisted InspectEvent model** | Maintainer-owned schema/design |
| **Schema evolution** | Migration policy and compatibility |
| **Redaction / security internals** | Security review required |
| **Package exports** | Published layout and consumer contracts |
| **OTLP sink architecture** | Future opt-in only |
| **Official adapter internals** | Use `@agent-inspect/adapter-sdk` examples instead |
| **Release process** | Maintainers own Changesets, versions, and publishing |

---

## Labels (reference)

Lane and status: `community-owned`, `maintainer-owned`, `status:ready`, `good first issue`, `help wanted`, `difficulty:intermediate`, `priority:p1`/`p2`.
Areas: `area:core`, `area:cli`, `area:logs`, `area:mcp`, `area:index`, `area:workspace`, `area:studio`, `area:viewer`, `area:community`, `area:release`.
Topics: `documentation`, `testing`, `fixtures`, `examples`, `security`, `integration:mcp`, `support:supported`, `support:preview`, `support:experimental`.
