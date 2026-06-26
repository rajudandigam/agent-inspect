# Maintainer Roadmap Execution Guide

How maintainers use Codex/Cursor-style maintainer sessions to ship AgentInspect in **small PR-sized chunks** while publishing **fewer npm releases** via **release trains**.

**Audience:** Repository maintainers and maintainer-owned AI coding sessions.
**Public companion:** [ROADMAP.md](../../ROADMAP.md) · **Active roadmap:** [ROADMAP-V1.8-TO-V3.md](./ROADMAP-V1.8-TO-V3.md) · **Train state:** [RELEASE-TRAIN-STATE.md](./RELEASE-TRAIN-STATE.md)
**Design:** [UNIFIED-PERSISTED-INSPECT-EVENT.md](../proposals/UNIFIED-PERSISTED-INSPECT-EVENT.md)
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
| **Small chunks** | Each maintainer session targets one PR-sized slice (types, one converter, one CLI path, docs-only). |
| **Do not publish every chunk** | Merge chunks to `main`; accumulate until a **release train** is coherent. |
| **Release trains** | Group related chunks into one npm version (e.g. all v1.2.0 foundation pieces). |
| **Publish gate** | Publish only after the train passes **release-train readiness** validation (below). |
| **Explicit publish** | **Never** version bump, tag, or publish unless the maintainer prompt explicitly instructs it. |
| **Patch releases** | Only for package breakage, security/safety regressions, or severe install/docs confusion. |

---

## 3. Current release train

### v1.2.0 — Unified persisted InspectEvent foundation

**npm status:** **Published** 2026-06-11 (`1.2.0`).  
**Shipped:** types, validators, converters, in-memory tree bridge, v0.2 fixtures/docs. Storage/CLI migration deferred.

Archive: [V1.2.0-RELEASE-READINESS.md](./V1.2.0-RELEASE-READINESS.md) · Checklist: [UNIFIED-PERSISTED-INSPECT-EVENT-CHECKLIST.md](../proposals/UNIFIED-PERSISTED-INSPECT-EVENT-CHECKLIST.md)

### v1.3.0 — Correlation, redaction profiles, LangChain streaming

**npm status:** **Published** 2026-06-12 (`agent-inspect@1.3.0`, `@agent-inspect/langchain@1.3.0`, `@agent-inspect/tui@1.2.1`).  
**Archive:** [V1.3.0-RELEASE-READINESS.md](./V1.3.0-RELEASE-READINESS.md)

### v1.4.0 — Local observability workflow

**npm status:** **Published** 2026-06-12 (`agent-inspect@1.4.0`, `@agent-inspect/langchain@1.4.0`, `@agent-inspect/tui@1.4.0`).  
**Archive:** [V1.4.0-RELEASE-READINESS.md](./V1.4.0-RELEASE-READINESS.md) · [V1.4.0-EXECUTION-PLAN.md](./V1.4.0-EXECUTION-PLAN.md)

| Chunk | Scope |
| ----- | ----- |
| **4A** | CI artifact recipe + [CI-ARTIFACTS.md](../CI-ARTIFACTS.md) |
| **4B** | `timeline` CLI ([#11](https://github.com/rajudandigam/agent-inspect/issues/11)) |
| **4C** | `stats` CLI ([#12](https://github.com/rajudandigam/agent-inspect/issues/12)) |
| **4D** | `search` CLI (deterministic local search) |
| **4E** | Docs, CHANGELOG, release readiness |

**Out of scope for v1.4.0:** Vitest/Jest reporter packages (defer to v1.4.x/v1.5.x).

---

## 4. Current and next release trains

Trains are **directional** — not delivery guarantees. Canonical ordering after the v1.7.0 publication is [ROADMAP-V1.8-TO-V3.md](./ROADMAP-V1.8-TO-V3.md). Operational pointer: [RELEASE-TRAIN-STATE.md](./RELEASE-TRAIN-STATE.md).

**Published baseline:** v1.7.0 — [V1.7.0-RELEASE-READINESS.md](./release-trains/V1.7.0-RELEASE-READINESS.md) · [V1.7.0-EXECUTION-PLAN.md](./release-trains/V1.7.0-EXECUTION-PLAN.md)

**Completed internal corrective train:** v1.5 corrective work — [V1.5.1-PATCH-PLAN.md](./release-trains/V1.5.1-PATCH-PLAN.md). This is complete on `main` and is not a publish target by default.

**Current train:** v1.8.0 deterministic checks, safe sharing, and CI — [ROADMAP-V1.8-TO-V3.md](./ROADMAP-V1.8-TO-V3.md)

Former **v1.4.1** (API boundary) and **v1.4.2** (reports) are **internal milestones inside v1.5.0**, not separate npm releases.

### v1.5.0 — API boundary, inspect/report, dual-format read

| Milestone | Scope |
| --------- | ----- |
| **M1** | Public API inventory + non-breaking subpath exports |
| **M2** | Trace vocabulary RFC + token metadata decision |
| **M3** | `what` / `report` CLI + adoption recipes |
| **M4** | Canonical v0.1+v0.2 read path; migrate inspection commands |

**Out of scope:** Vitest/Jest reporters, cohort/check/assert, AI SDK, framework adapters.

### v1.5.1 — Corrective patch before v1.6.0

| Chunk | Scope |
| ----- | ----- |
| **1** | CLI version and dual-format metadata parity |
| **2** | Whole-report redaction and normalization fidelity |
| **3** | Token vocabulary completion (`input`, `output`, `total`, `cached`) |
| **4** | Documentation, release-readiness evidence, and final regression gate |

**Out of scope:** v1.6 implementation, changesets, version bumps, tags, publish, provider pricing, and default network behavior.

### v1.6.0 — Runtime foundation and universal ingestion

- experimental inspector runtime;
- trace writer contract;
- trace reader contract;
- OpenInference and OTLP JSON local readers;
- universal `agent-inspect open`.

### v1.7.0 — Framework adapters

- published experimental `@agent-inspect/ai-sdk` optional adapter ([#30](https://github.com/rajudandigam/agent-inspect/issues/30));
- OpenAI Agents scaffold/RFC and LangGraph boundary decision; runtime mapping and executable fixtures continue in v1.8.

### v1.8.0 — Deterministic checks, safe sharing, and CI

- adapter correctness catch-up before checks;
- deterministic `check` rules, safe artifacts, and optional `@agent-inspect/vitest` / `@agent-inspect/jest` reporters ([#24](https://github.com/rajudandigam/agent-inspect/issues/24), [#28](https://github.com/rajudandigam/agent-inspect/issues/28)).

### v1.9.0 — Standards hardening

- OpenInference / conformance fixtures ([#25](https://github.com/rajudandigam/agent-inspect/issues/25))

### v2.0 — Stable trace contract

- Stable persisted trace contract and public adapter/reporter/exporter APIs
- Unified write format; `schemaVersion: "0.1"` remains readable
- Migration guide from v1.x; conformance test suite as contract gate

**Post-v2 exploratory:** OTLP HTTP sink (opt-in, explicit endpoint only) — not in v1.9.0 scope.

---

## 5. Cursor prompt rules

Every maintainer implementation prompt **must** include:

1. **Read first** — list of files to read before editing (README, relevant proposal, affected `packages/` paths).
2. **Phase 0 audit** — report current state (version, existing types, tests, docs) **before** edits.
3. **In-scope** — explicit allowed work for this chunk.
4. **Out-of-scope** — explicit forbidden work (other trains, publish, schema breaks).
5. **Tests to add** — named test files or behaviors.
6. **Validation commands** — from §8 below or [ROADMAP-EXECUTION-V1.5-TO-V2.md §8](./ROADMAP-EXECUTION-V1.5-TO-V2.md#8-validation-matrix), matched to change type.
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
