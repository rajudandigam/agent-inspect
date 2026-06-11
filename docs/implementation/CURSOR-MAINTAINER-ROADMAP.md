# Cursor Maintainer Roadmap Execution Guide

How maintainers use Cursor to ship AgentInspect in **small PR-sized chunks** while publishing **fewer npm releases** via **release trains**.

**Audience:** Repository maintainers and Cursor sessions executing maintainer-owned work.  
**Public companion:** [ROADMAP.md](../../ROADMAP.md) · **Design:** [UNIFIED-PERSISTED-INSPECT-EVENT.md](../proposals/UNIFIED-PERSISTED-INSPECT-EVENT.md)  
**Historical/private notes:** `docs-local/` (if present) — not required for contributors.

---

## 1. Product boundary

AgentInspect is a **local-first trace workbench** for TypeScript AI agents. It helps developers understand, debug, compare, annotate, and export agent runs **locally** before they need a hosted observability platform.

AgentInspect is **not**:

- a SaaS or hosted dashboard product
- a production observability / APM replacement
- a replay or cassette execution engine
- a cost or token billing engine in core
- a universal monkey-patching or ambient auto-instrumentation framework
- a default vendor upload pipeline

**Core concept:** an **execution tree of steps** — manual traces, structured logs, optional adapters — inspected via CLI-first workflows.

---

## 2. Release strategy

| Principle | Rule |
| --------- | ---- |
| **Small chunks** | Each Cursor session targets one PR-sized slice (types, one converter, one CLI path, docs-only). |
| **Do not publish every chunk** | Merge chunks to `main`; accumulate until a **release train** is coherent. |
| **Release trains** | Group related chunks into one npm version (e.g. all v1.2.0 foundation pieces). |
| **Publish gate** | Publish only after the train passes **release-train readiness** validation (below). |
| **Explicit publish** | **Never** version bump, tag, or publish unless the maintainer prompt explicitly instructs it. |
| **Patch releases** | Only for package breakage, security/safety regressions, or severe install/docs confusion. |

---

## 3. Current release train

### v1.2.0 — Unified persisted InspectEvent foundation

**npm status:** Not published — `package.json` remains **1.1.0** until this train ships.  
**Design status:** PR 1 complete (proposal + checklist). Implementation chunks PR 2–8 pending.

| Chunk | Scope | Publish alone? |
| ----- | ----- | -------------- |
| **PR 1** | Proposal, checklist, architecture links | No — docs only |
| **PR 2** | `PersistedInspectEvent` types + `isPersistedInspectEvent` validator | No |
| **PR 3** | Legacy `0.1` `TraceEvent` → persisted conversion helpers | No |
| **PR 4** | Log-derived `InspectEvent` → persisted conversion helpers | No |
| **PR 5** | LangChain adapter event → persisted conversion helpers | No |
| **PR 6** | Source-agnostic tree builder bridge | No |
| **PR 7** | CLI read-path integration (if approved) | No |
| **PR 8** | Docs, fixtures, CHANGELOG preparation for v1.2.0 | No — still needs changeset + publish instruction |

**Train publish criteria:** Types, converters, read path, and docs are coherent; `schemaVersion: "0.1"` traces still readable; `pnpm compat:smoke` passes.

Checklist: [UNIFIED-PERSISTED-INSPECT-EVENT-CHECKLIST.md](../proposals/UNIFIED-PERSISTED-INSPECT-EVENT-CHECKLIST.md)  
Next prompt stub: [prompts/v1.2.0-pr2-persisted-event-types.md](./prompts/v1.2.0-pr2-persisted-event-types.md)

---

## 4. Next release trains

Trains are **directional** — not delivery guarantees. See [ROADMAP.md](../../ROADMAP.md).

### v1.3.0 — LangChain depth + correlation + redaction profiles

- LangChain streaming (design [#14](https://github.com/rajudandigam/agent-inspect/issues/14), maintainer-owned)
- `correlationId` / `requestId` / `decisionId` propagation in persisted metadata
- Capture policy: `onSuccess` metadata-only / `onError` preview
- Redaction profiles and share-safe export defaults

### v1.4.0 — CI artifacts + timeline + stats

- GitHub Actions trace artifact recipe ([#24](https://github.com/rajudandigam/agent-inspect/issues/24))
- Vitest reporter; optional Jest reporter
- `timeline` CLI ([#11](https://github.com/rajudandigam/agent-inspect/issues/11))
- `stats` CLI ([#12](https://github.com/rajudandigam/agent-inspect/issues/12))

### v1.5.0 — Cohort + regression fixtures

- Cohort views (local aggregates across runs)
- `check` / `assert` style local eval helpers (not hosted eval platform)
- Multi-run regression fixtures ([#28](https://github.com/rajudandigam/agent-inspect/issues/28))

### v1.6.0 — Logging bridges

- NestJS / logging bridge recipes and optional packages
- Optional `pino` / `log4js` / `winston` helper packages (if justified)

### v1.7.0+ — Adapters + standards

- Vercel AI SDK adapter ([#30](https://github.com/rajudandigam/agent-inspect/issues/30) design)
- Standards hardening (OpenInference / Phoenix fixtures)
- Experimental OTLP HTTP sink (opt-in, explicit endpoint only)

### v2.0 — Stable trace contract

- Stable persisted trace contract and public adapter/reporter/exporter/sink APIs
- Migration guide from v1.x
- Conformance test suite as contract gate

---

## 5. Cursor prompt rules

Every maintainer Cursor prompt **must** include:

1. **Read first** — list of files to read before editing (README, relevant proposal, affected `packages/` paths).
2. **Phase 0 audit** — report current state (version, existing types, tests, docs) **before** edits.
3. **In-scope** — explicit allowed work for this chunk.
4. **Out-of-scope** — explicit forbidden work (other trains, publish, schema breaks).
5. **Tests to add** — named test files or behaviors.
6. **Validation commands** — from §8 below, matched to change type.
7. **Final report** — files changed, validation results, confirmations, next step.
8. **No publish / no version bump** unless the prompt explicitly says otherwise.

Store reusable prompts under `docs/implementation/prompts/`.

---

## 6. Maintainer-owned areas

Coordinate before implementation PRs. See [CONTRIBUTOR-ROLES.md](../community/CONTRIBUTOR-ROLES.md).

| Area | Why maintainer-owned |
| ---- | -------------------- |
| Unified persisted InspectEvent model | Core schema / read-write contract |
| Schema evolution (`0.1` / `0.2` / v2) | Compatibility across v1.x |
| Redaction / security internals | Safe-by-default promise |
| Package exports (ESM/CJS, root tarball) | Consumer breakage risk |
| LangChain streaming internals | Adapter persistence semantics |
| OTLP sink architecture | Vendor-upload perception risk |
| v2 stable trace contract | Major-version API promises |
| Release process | Changesets, publish, tags |

---

## 7. Contributor-friendly areas

Safe for external contributors when scoped in a live issue:

- Documentation and proposal wording (not schema decisions)
- Examples and recipes (`examples/recipes/`)
- Fixtures (`fixtures/`) and `pnpm fixtures:check`
- CLI output samples and export fixture tests
- Safe trace sharing docs ([#26](https://github.com/rajudandigam/agent-inspect/issues/26))
- Community onboarding ([GOOD-FIRST-ISSUES.md](../../GOOD-FIRST-ISSUES.md))

OSS issue batches [#7–#30](https://github.com/rajudandigam/agent-inspect/issues/18) run **in parallel** with maintainer trains — they do not block v1.2.0 chunks.

---

## 8. Validation levels

### Docs-only

```bash
pnpm typecheck
pnpm test
```

### Fixtures / examples

```bash
pnpm typecheck
pnpm test
pnpm fixtures:check
pnpm recipes:check
```

### Runtime / core

```bash
pnpm build
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm size
pnpm test:all
pnpm pack:smoke
```

### Release-train readiness (before publish instruction)

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm size
pnpm test:all
pnpm pack:smoke
pnpm compat:smoke
npm pack --dry-run
```

Also verify CLI help from built output when CLI touched:

```bash
node packages/cli/dist/index.cjs --help
```

---

## 9. Minimal release policy

- **Do not publish each chunk.** Accumulate until the train is coherent.
- **v1.2.0** publishes when types, converters, read path (if approved), fixtures, and docs align — not after PR 2 alone.
- **v1.3.0** publishes when streaming/correlation/redaction-profile train is coherent.
- **Patch releases** (e.g. 1.1.1) only for compatibility breakage, security/safety fixes, or severe install confusion — not for each docs PR.

---

## 10. Release gates

A release train is **publishable** only when:

- [ ] `README.md`, `ROADMAP.md`, and `CHANGELOG.md` describe the shipped version accurately
- [ ] Existing `schemaVersion: "0.1"` traces remain readable (fixture + compat tests)
- [ ] No vendor upload or default network telemetry introduced
- [ ] No unapproved root dependencies added (`chalk`, `commander`, `nanoid` only on root)
- [ ] `pnpm compat:smoke` and `pnpm pack:smoke` pass
- [ ] `SECURITY.md` and redaction docs match behavior
- [ ] Changeset added and maintainer explicitly requests version bump + publish
- [ ] Relevant OSS issues updated or closed with PR links

Monthly hygiene: [MONTHLY-OSS-HYGIENE.md](../community/MONTHLY-OSS-HYGIENE.md).

---

## Related

- [MAINTAINER-GUIDE.md](../community/MAINTAINER-GUIDE.md) — changesets, publish workflow
- [UNIFIED-PERSISTED-INSPECT-EVENT-CHECKLIST.md](../proposals/UNIFIED-PERSISTED-INSPECT-EVENT-CHECKLIST.md) — v1.2.0 chunk checkboxes
- [prompts/](./prompts/) — copy-paste Cursor prompts per chunk
