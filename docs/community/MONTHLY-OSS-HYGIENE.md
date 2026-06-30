# Monthly OSS hygiene

Lightweight maintainer checklist for keeping AgentInspect's public open-source surface honest. Run roughly **once per month** (or after a release).

Not automated. No SLA implied.

---

## Issues and contributor index

- [ ] **Check [GOOD-FIRST-ISSUES.md](../../GOOD-FIRST-ISSUES.md)** — no closed issues listed as open; lane groupings match live GitHub milestones (#5–#9).
- [ ] Triage open issues in **Now** lanes ([#7](https://github.com/rajudandigam/agent-inspect/issues/7), [#9–#10](https://github.com/rajudandigam/agent-inspect/issues/9), [#13](https://github.com/rajudandigam/agent-inspect/issues/13), [#18–#19](https://github.com/rajudandigam/agent-inspect/issues/18), [#25](https://github.com/rajudandigam/agent-inspect/issues/25), [#27](https://github.com/rajudandigam/agent-inspect/issues/27), [#29](https://github.com/rajudandigam/agent-inspect/issues/29), [#60–#69](https://github.com/rajudandigam/agent-inspect/issues/60)).
- [ ] Close duplicates; link merged PRs on completed issues.
- [ ] Prefer **3–5 open good-first issues** at a time — defer large waves.

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
