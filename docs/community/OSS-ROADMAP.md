# OSS contributor roadmap

Contributor-facing view of where AgentInspect is and where community help fits. The public sequencing lives in [ROADMAP.md](../../ROADMAP.md); this page translates it into contribution opportunities.

## Where we are

- **Current npm release:** **6.7.3** — eighteen linked public packages, persisted trace schema **1.0**, Node `>=20`.
- **v4–v6 trains (workspace, suites/cohorts/gates, self-hosted Studio and standards):** shipped.
- **Now:** pre-v7 **adoption evidence** — correctness, portability, external pilot intake, standards/MCP evidence, and contributor experience around the shipped system. Prefer evidence/docs/fixtures over new product surfaces.
- **v7:** conditional on adoption and **not scheduled**.
- **Pilot gates:** remain `_pending_` in [PRE-V7-ADOPTION-EVIDENCE.md](../implementation/PRE-V7-ADOPTION-EVIDENCE.md) — do not fabricate completion.

## What contribution looks like now

| Milestone | Community opportunity | Example live issues |
| --------- | --------------------- | ------------------- |
| External Pilot & Adoption | Pilot form, kit sync, retained CI, Studio import | [#151](https://github.com/rajudandigam/agent-inspect/issues/151)–[#153](https://github.com/rajudandigam/agent-inspect/issues/153), [#161](https://github.com/rajudandigam/agent-inspect/issues/161) |
| 6.7.3 — Correctness & Portability | Cross-platform packed evidence, SQLite matrix, writer/perf corpora | [#154](https://github.com/rajudandigam/agent-inspect/issues/154)–[#157](https://github.com/rajudandigam/agent-inspect/issues/157), [#166](https://github.com/rajudandigam/agent-inspect/issues/166), [#169](https://github.com/rajudandigam/agent-inspect/issues/169) |
| Contributor Experience — 2026 Q3 | Docs hygiene, ownership, README/network consistency | [#67](https://github.com/rajudandigam/agent-inspect/issues/67), [#100](https://github.com/rajudandigam/agent-inspect/issues/100), [#168](https://github.com/rajudandigam/agent-inspect/issues/168) |
| Standards Evidence | Preservation corpus, version/loss checks, Collector, MCP protocol-state | [#162](https://github.com/rajudandigam/agent-inspect/issues/162)–[#165](https://github.com/rajudandigam/agent-inspect/issues/165) |
| Golden Path & Examples | Packed E2E, causal fixtures, Studio walkthroughs, adapter CI template | [#65](https://github.com/rajudandigam/agent-inspect/issues/65)–[#66](https://github.com/rajudandigam/agent-inspect/issues/66), [#115](https://github.com/rajudandigam/agent-inspect/issues/115), [#158](https://github.com/rajudandigam/agent-inspect/issues/158)–[#160](https://github.com/rajudandigam/agent-inspect/issues/160), [#167](https://github.com/rajudandigam/agent-inspect/issues/167) |

Runtime, schema, and release implementation remain **maintainer-owned**; contributor value is in tests, fixtures, docs, examples, adapters, and standards interop. Behavior changes need explicit maintainer sign-off on the issue first.

Batch map: [CREATED-OSS-ISSUES-6.7.3-02.md](./CREATED-OSS-ISSUES-6.7.3-02.md) · indexes: [GOOD-FIRST-ISSUES.md](./GOOD-FIRST-ISSUES.md) · metrics: [OSS-METRICS.md](./OSS-METRICS.md)

## Contribution lanes

See [CONTRIBUTOR-LANES.md](./CONTRIBUTOR-LANES.md) for the active lanes and their starting points.

## Non-goals

No hosted SaaS, no production APM replacement, no default vendor upload, no replay-by-default, no cost analytics engine. The self-hosted, customer-owned Studio is in scope; a hosted dashboard service is not. AgentInspect complements platforms like LangSmith, Langfuse, Braintrust, Phoenix, and OpenTelemetry — it does not replace them.

## Related

- [GOOD-FIRST-ISSUES.md](../../GOOD-FIRST-ISSUES.md)
- [ISSUE-TRIAGE.md](./ISSUE-TRIAGE.md) (maintainer task list)
- [PROJECT-VISION.md](./PROJECT-VISION.md)
