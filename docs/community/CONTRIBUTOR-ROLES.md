# Contributor roles

How participation works in AgentInspect after the 1.1.0 open-source activation. Permissions are granted by repository maintainers — this doc describes intent, not automatic access.

## Role summary

| Role | When to use | Typical permissions | Can own | Should not own (yet) |
| ---- | ----------- | ------------------- | ------- | -------------------- |
| **External contributor** | First PR or drive-by fix | Fork + PR | Docs, examples, fixtures, tests for scoped issues | Schema, redaction internals, package exports |
| **Issue owner** | Commented "I'll take this" on a live issue | Same as external | One issue end-to-end with maintainer review | Cross-cutting API changes without ack |
| **Triage collaborator** | Recurring helpful issue/PR triage | `Triage` on GitHub (optional) | Labels, duplicates, clarifying questions | Merge to main, releases |
| **Write collaborator** | Sustained quality contributions | `Write` on GitHub | Docs/examples/fixtures; small scoped fixes | Maintainer-owned areas below |
| **Maintainer** | Roadmap, releases, security | `Admin` / owner | Roadmap, changesets, publish, schema/security | N/A |

See [CONTRIBUTING.md](../../CONTRIBUTING.md) and [MAINTAINER-GUIDE.md](./MAINTAINER-GUIDE.md).

---

## External contributor

**When:** You opened your first PR or want to fix docs/fixtures/examples from [GOOD-FIRST-ISSUES.md](../../GOOD-FIRST-ISSUES.md).

**Permissions:** Standard open-source fork workflow. No repo write access required.

**Can own:**

- Documentation improvements
- Runnable recipes and examples
- Canonical fixtures and validation scripts
- Tests that lock behavior for approved issues
- Issue wording suggestions (via PR to [docs/archive/github/](../../docs/archive/github/) or a live issue comment)

**Should not own yet:**

- `schemaVersion: "0.1"` breaking changes
- Redaction/security algorithm changes
- Root `agent-inspect` package export map changes
- OTLP HTTP sink architecture
- Publishing or version bumps

---

## Issue owner

**When:** You commented on a live GitHub issue and maintainers acknowledged scope.

**Permissions:** Same as external contributor; social ownership of one issue.

**Can own:**

- Design proposal docs (timeline/stats/LangChain streaming RFC)
- Implementation for **non-maintainer-owned** issues after ack
- Keeping issue checklist updated in PR description

**Should not own:**

- Expanding scope into maintainer-owned areas without a new issue and maintainer ack
- Creating live GitHub issues or labels (maintainer scripts)

---

## Triage collaborator

**When:** You regularly help classify issues, ask clarifying questions, and link duplicates.

**Permissions:** GitHub **`Triage`** (optional grant).

**Can own:**

- Applying the repo's existing label set on live issues
- Redirecting questions to [Discussions](./DISCUSSIONS-STARTERS.md)
- Pointing contributors to validation commands in [CONTRIBUTING.md](../../CONTRIBUTING.md)

**Should not own:**

- Merging PRs that touch core tracing defaults without maintainer review
- Closing security reports without maintainer involvement

---

## Write collaborator

**When:** Sustained, high-quality contributions; maintainers invite you for velocity on safe areas.

**Permissions:** GitHub **`Write`** — branch push to repo (still via PR recommended).

**Can own:**

- Docs, examples, fixtures, CLI output samples
- Review of other contributors' good-first PRs (if asked)
- Discussions summaries fed back into ROADMAP

**Should not own:**

- Changesets / npm publish
- Modifying `publish.yml` or release automation without maintainer review
- Maintainer-owned core areas (below)

---

## Maintainer

**When:** Repository owner or explicitly delegated release/security steward.

**Permissions:** Admin, npm publish, changesets, label/issue batch scripts.

**Can own:**

- Roadmap Now/Next/Future
- Schema evolution and unified persisted InspectEvent model
- Redaction, event size bounds, storage safety
- Package exports and compatibility
- LangChain adapter persistence semantics
- OTLP sink experiments (Future)
- [MONTHLY-OSS-HYGIENE.md](./MONTHLY-OSS-HYGIENE.md) pass

**Community responsibilities:**

- Enable or maintain Discussions and pin stack survey
- Keep [GOOD-FIRST-ISSUES.md](../../GOOD-FIRST-ISSUES.md) aligned with live issues
- Update [CONTRIBUTORS.md](./CONTRIBUTORS.md) with permission

---

## Maintainer-owned areas (all roles)

These remain **maintainer-owned** until explicitly promoted in ROADMAP and a live issue says otherwise:

| Area | Why |
| ---- | --- |
| **Unified persisted InspectEvent model** | Aligns manual JSONL and adapter-persisted events |
| **Schema evolution** | `schemaVersion: "0.1"` compatibility across v1.x |
| **Redaction / security internals** | Safe-by-default promise |
| **Package exports** | ESM/CJS consumer compatibility |
| **OTLP HTTP sink architecture** | High risk of implying vendor upload |
| **v2 stable trace contract** | Major-version migration and public API promises |
| **Default tracing behavior** | `inspectRun` defaults and env gating semantics |

Contributors may still propose **docs, fixtures, and RFCs** — implementation merges require maintainer ack.

---

## Contributor-friendly areas

| Area | Examples |
| ---- | -------- |
| Docs | COMPARE, DIFF, CLI proposed commands, ADAPTERS streaming RFC |
| Fixtures | OpenInference export, tool failure + retry JSONL |
| Examples / recipes | Decision metadata, logging shapes |
| Tests | Export conformance, fixture validation |
| Outreach | [OUTREACH-TEMPLATES.md](./OUTREACH-TEMPLATES.md) feedback |

---

## Recognition

Merged contributors may be listed in [CONTRIBUTORS.md](./CONTRIBUTORS.md) by maintainers after release passes. No fake entries; no CLA required (MIT).
