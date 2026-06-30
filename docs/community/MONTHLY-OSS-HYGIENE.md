# Monthly OSS hygiene

Lightweight maintainer checklist for keeping AgentInspect's public open-source surface honest after 1.1.0. Run roughly **once per month** (or after a release).

Not automated. No SLA implied.

---

## Issue and draft hygiene

- [ ] Run [ISSUE-HYGIENE-PLAN.md](./ISSUE-HYGIENE-PLAN.md) review after each minor release (v3.5.x+).
- [ ] **Close or refresh stale issues** using `scripts/close-stale-issues-v3-oss.sh` and `scripts/update-existing-issues-v3-oss.sh` (DRY_RUN first).
- [ ] **Create v3 milestones** if missing: `scripts/github-milestones-v3-oss.sh`.
- [ ] **Batch 03 (#58–#69):** triage comments/PRs; keep [GOOD-FIRST-ISSUES.md](../../GOOD-FIRST-ISSUES.md) lane tables current.
- [ ] **Check [GOOD-FIRST-ISSUES.md](../../GOOD-FIRST-ISSUES.md)** — no closed issues listed as open; lane groupings current.
- [ ] Close duplicates; link merged PRs on completed issues (#8, #20, #21, #26 shipped).
- [ ] **Defer large issue waves** — prefer 3–5 live issues at a time from batch 03.

---

## Roadmap and docs

- [ ] **Align ROADMAP / README / CHANGELOG** with `package.json` version (currently **3.5.3**).
- [ ] Move finished work from ROADMAP **Now** → **Released recently** when shipped.
- [ ] Keep **Next** / **Future** non-committal (no SaaS/dashboard claims).
- [ ] Re-read [CHANGELOG.md](../../CHANGELOG.md) top section matches npm latest.

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
- [ ] `pnpm compat:smoke` and `pnpm pack:smoke` before next publish

---

## Related

- [MAINTAINER-GUIDE.md](./MAINTAINER-GUIDE.md)
- [CONTRIBUTOR-ROLES.md](./CONTRIBUTOR-ROLES.md)
- [ROADMAP.md](../../ROADMAP.md)
