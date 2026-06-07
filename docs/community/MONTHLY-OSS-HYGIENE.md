# Monthly OSS hygiene

Lightweight maintainer checklist for keeping AgentInspect's public open-source surface honest after 1.1.0. Run roughly **once per month** (or after a release).

Not automated. No SLA implied.

---

## Issue and draft hygiene

- [ ] **Close or archive stale completed drafts** in `.github/ISSUE_DRAFTS/` (especially items shipped in 1.0.x / 1.1.0 — e.g. CJS exports, redaction, LangChain persistence).
- [ ] **Check whether [GOOD-FIRST-ISSUES.md](../../GOOD-FIRST-ISSUES.md) points to live issue links**, not only draft files.
- [ ] **Review issue batch [#7–#14](https://github.com/rajudandigam/agent-inspect/issues?q=is%3Aissue+is%3Aopen)** before opening more issues — triage comments/PRs, close duplicates, adjust labels.
- [ ] **Review Batch 02** ([.github/LIVE_ISSUE_BATCH_02/](../../.github/LIVE_ISSUE_BATCH_02/)) before creating Batch 03 — triage batch 01 [#7–#14](https://github.com/rajudandigam/agent-inspect/issues?q=is%3Aissue+is%3Aopen) first.
- [ ] **Close or update issues** that become completed through merged PRs (link PR, remove from good-first lists).
- [ ] **Keep good-first issues below ~15 active items** where possible — stagger batch 02 opening per [LIVE_ISSUE_BATCH_02/README.md](../../.github/LIVE_ISSUE_BATCH_02/README.md).
- [ ] **Move accepted design proposals** (e.g. Vercel AI SDK adapter RFC) into [ROADMAP.md](../../ROADMAP.md) Next/Future with maintainer ack.
- [ ] **Convert 3–5 useful drafts** into live GitHub issues — not the entire backlog. Use batch 02 pattern via [scripts/create-live-issues-batch-02.sh](../../scripts/create-live-issues-batch-02.sh).
- [ ] **Do not reopen** completed 1.1.0 work as active issues unless tracking follow-up bugs.
- [ ] Update [GOOD-FIRST-ISSUES.md](../../GOOD-FIRST-ISSUES.md) with live `#NNN` links and remove duplicates.

---

## Roadmap and docs

- [ ] **Move finished work** from ROADMAP **Now** → **Released recently** when shipped.
- [ ] Keep **Next** / **Future** non-committal (no delivery dates, no SaaS/dashboard claims).
- [ ] Re-read [CHANGELOG.md](../../CHANGELOG.md) top section matches npm latest.
- [ ] Scan public docs for stale **Unreleased** or **pre-release** wording.

---

## Community

- [ ] **Thank contributors** publicly (issue comment, [CONTRIBUTORS.md](./CONTRIBUTORS.md), or release notes) — with permission.
- [ ] Review **GitHub Discussions** for roadmap input; summarize themes into Issues or ROADMAP (see [DISCUSSIONS-STARTERS.md](./DISCUSSIONS-STARTERS.md)).
- [ ] Use [OUTREACH-TEMPLATES.md](./OUTREACH-TEMPLATES.md) sparingly — feedback first, one issue per message.

---

## Product boundaries (re-check)

- [ ] **`packages/core/test/package-boundaries.test.ts`** still passes — root deps lean (`chalk`, `commander`, `nanoid`).
- [ ] **No vendor upload** language crept into README, issues, or examples.
- [ ] **Maintainer-owned** areas unchanged without explicit ack: unified persisted InspectEvent model, schema evolution, redaction internals, package exports, OTLP sink architecture, v2 trace contract (see [CONTRIBUTOR-ROLES.md](./CONTRIBUTOR-ROLES.md)).
- [ ] LangChain / TUI still labeled **experimental** in [docs/API.md](../API.md).

---

## Release-adjacent (when applicable)

- [ ] Clean temp-dir `npm install agent-inspect@<latest>` + `npx agent-inspect --help`
- [ ] `pnpm fixtures:check` and `pnpm recipes:check` on main
- [ ] Optional: `pnpm pack:smoke` before next publish

---

## Related

- [MAINTAINER-GUIDE.md](./MAINTAINER-GUIDE.md)
- [CONTRIBUTOR-ROLES.md](./CONTRIBUTOR-ROLES.md)
- [ROADMAP.md](../../ROADMAP.md)
