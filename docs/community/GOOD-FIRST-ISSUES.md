# Good first issues (expanded)

Quick index: [GOOD-FIRST-ISSUES.md](../../GOOD-FIRST-ISSUES.md)

The live issue tracker is the source of truth. Use GitHub `#NNN` links — not archived draft markdown under [docs/archive/github/](../../docs/archive/github/).

**Current npm release:** `agent-inspect@6.7.3` (eighteen linked public packages). Pre-v7 pilot evidence remains `_pending_` — do not mark gates complete.

---

## How to find live work

- [`community-owned` + `status:ready`](https://github.com/rajudandigam/agent-inspect/issues?q=is%3Aissue+is%3Aopen+label%3Acommunity-owned+label%3Astatus%3Aready) — vetted, unblocked
- [`good first issue`](https://github.com/rajudandigam/agent-inspect/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) — smallest scoped entries
- Filter further by area label: `area:core`, `area:cli`, `area:logs`, `area:mcp`, `area:index`, `area:studio`, `area:viewer`, `area:community`, `area:release`

Every issue lists its contribution lane, difficulty, priority, acceptance criteria, and validation commands. Check the comments for maintainer notes and existing claims before starting.

## Current milestones and what they want

| Milestone | Typical work |
| --------- | ------------ |
| **External Pilot & Adoption** | Pilot feedback form, pilot-kit sync, retained CI recipe, GHA→Studio import |
| **6.7.3 — Correctness & Portability** | Windows/macOS/Node 24 packed-consumer evidence, SQLite matrix, writer corpus, perf evidence |
| **Contributor Experience — 2026 Q3** | Docs hygiene checks, triage/ownership guides, README consistency |
| **Standards Evidence** | Preservation corpus, version/loss checks, Collector recipe, MCP protocol-state |
| **Golden Path & Examples** | Packed E2E, causal fixtures, Studio walkthroughs, adapter CI template |

## Live issues by difficulty

### Good first

| Issue | Title | Milestone |
| ----- | ----- | --------- |
| [#65](https://github.com/rajudandigam/agent-inspect/issues/65) | VS Code extension onboarding screenshots/GIF | Golden Path & Examples |
| [#67](https://github.com/rajudandigam/agent-inspect/issues/67) | Improve doctor troubleshooting messages | Contributor Experience — 2026 Q3 |
| [#151](https://github.com/rajudandigam/agent-inspect/issues/151) | Add external pilot feedback form and anonymized evidence template | External Pilot & Adoption |
| [#152](https://github.com/rajudandigam/agent-inspect/issues/152) | Sync pre-v7 pilot kit and adoption-evidence docs to 6.7.3 | External Pilot & Adoption |
| [#163](https://github.com/rajudandigam/agent-inspect/issues/163) | Add standards tested-version and known-loss consistency check | Standards Evidence |
| [#168](https://github.com/rajudandigam/agent-inspect/issues/168) | Add package README support-level and network-behavior consistency check | Contributor Experience — 2026 Q3 |

### Intermediate

| Issue | Title | Milestone |
| ----- | ----- | --------- |
| [#153](https://github.com/rajudandigam/agent-inspect/issues/153) | Add a retained TraceContract/suite CI-gate pilot recipe | External Pilot & Adoption |
| [#154](https://github.com/rajudandigam/agent-inspect/issues/154) | Record Windows Node 22 ESM packed-consumer evidence | 6.7.3 — Correctness & Portability |
| [#155](https://github.com/rajudandigam/agent-inspect/issues/155) | Record macOS Node 20/22 CJS packed-consumer evidence | 6.7.3 — Correctness & Portability |
| [#156](https://github.com/rajudandigam/agent-inspect/issues/156) | Extend packed-consumer compatibility evidence to Node 24 ESM and CJS | 6.7.3 — Correctness & Portability |
| [#159](https://github.com/rajudandigam/agent-inspect/issues/159) | Add broken-run → contract-fail → fixed-run golden-path fixture | Golden Path & Examples |
| [#160](https://github.com/rajudandigam/agent-inspect/issues/160) | Add share-safe bundle → local Studio import walkthrough | Golden Path & Examples |
| [#165](https://github.com/rajudandigam/agent-inspect/issues/165) | Add MCP protocol-state fixture corpus | Standards Evidence |
| [#167](https://github.com/rajudandigam/agent-inspect/issues/167) | Add third-party adapter conformance CI template | Golden Path & Examples |
| [#169](https://github.com/rajudandigam/agent-inspect/issues/169) | Add large trace-directory warning and performance evidence suite | 6.7.3 — Correctness & Portability |

### Advanced / maintainer-reviewed

| Issue | Title | Milestone |
| ----- | ----- | --------- |
| [#157](https://github.com/rajudandigam/agent-inspect/issues/157) | Add native SQLite clean-install compatibility matrix | 6.7.3 — Correctness & Portability |
| [#158](https://github.com/rajudandigam/agent-inspect/issues/158) | Extend packed golden-path E2E through report, check, bundle, and verify-safe | Golden Path & Examples |
| [#161](https://github.com/rajudandigam/agent-inspect/issues/161) | Add GitHub Actions artifact → Studio import walkthrough | External Pilot & Adoption |
| [#162](https://github.com/rajudandigam/agent-inspect/issues/162) | Add OTLP/OpenInference preservation corpus… | Standards Evidence |
| [#164](https://github.com/rajudandigam/agent-inspect/issues/164) | Add local OpenTelemetry Collector round-trip recipe | Standards Evidence |
| [#166](https://github.com/rajudandigam/agent-inspect/issues/166) | Add writer crash, concurrency, and shutdown regression corpus | 6.7.3 — Correctness & Portability |

### Preserved open (special handling)

| Issue | Notes |
| ----- | ----- |
| [#66](https://github.com/rajudandigam/agent-inspect/issues/66) | VS Code sample-trace command — `status:blocked` |
| [#100](https://github.com/rajudandigam/agent-inspect/issues/100) | CODEOWNERS — maintainer-owned |
| [#115](https://github.com/rajudandigam/agent-inspect/issues/115) | ADPA recipe — design-partner gated (PR #142 held) |

Batch map: [CREATED-OSS-ISSUES-6.7.3-02.md](./CREATED-OSS-ISSUES-6.7.3-02.md).

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
| **Fabricating pilot evidence** | External findings must be real and dated |

---

## Labels (reference)

Lane and status: `community-owned`, `maintainer-owned`, `status:ready`, `good first issue`, `help wanted`, `difficulty:intermediate`, `priority:p1`/`p2`.
Areas: `area:core`, `area:cli`, `area:logs`, `area:mcp`, `area:index`, `area:workspace`, `area:studio`, `area:viewer`, `area:community`, `area:release`.
Topics: `documentation`, `testing`, `fixtures`, `examples`, `security`, `integration:mcp`, `support:supported`, `support:preview`, `support:experimental`.
