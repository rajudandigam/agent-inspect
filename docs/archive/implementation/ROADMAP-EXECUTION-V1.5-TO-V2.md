# Historical reference only. Do not use as active Codex instructions. See docs/implementation/README.md and ROADMAP-V1.8.1-TO-V3.md.

# Roadmap execution program — v1.5.0 through v2.0.0

**Audience:** Repository maintainers and Cursor sessions executing maintainer-owned release trains.  
**Status:** Historical program document. Superseded after v1.5.0 by [ROADMAP-V1.6-TO-V3.md](./ROADMAP-V1.6-TO-V3.md).
**Companion:** [RELEASE-TRAIN-STATE.md](./RELEASE-TRAIN-STATE.md) (operational pointer only) · [CURSOR-MAINTAINER-ROADMAP.md](./CURSOR-MAINTAINER-ROADMAP.md) · public [ROADMAP.md](../../ROADMAP.md)

---

## 1. Product boundary

AgentInspect is a **local-first execution-tree debugger** for TypeScript AI agents.

**Canonical product loop:**

```
framework event → local JSONL → inspect / report / diff → CI artifact → optional standards export
```

AgentInspect helps developers understand, debug, compare, annotate, and export agent runs **locally** before they need a hosted observability platform.

**Core concept:** an **execution tree of steps** — not a general-purpose logger.

**AgentInspect is not:**

- a SaaS or hosted dashboard product
- a production APM replacement
- a replay or cassette execution engine
- a cost or token billing engine in core
- universal ambient auto-instrumentation
- a default vendor upload pipeline

**MVP drift guardrails** (do not implement unless explicitly promoted in this program):

- No SQLite, replay, token counting, cost calculation, browser dashboard, OpenTelemetry as default, or plugin system
- No general-purpose logger API

---

## 2. Source-of-truth hierarchy

When documents disagree, resolve in this order:

1. **Git state** + package manifests (`package.json`, `.changeset/config.json`)
2. **Tests and fixtures** (`fixtures/`, `pnpm fixtures:check`, compat smoke)
3. [RELEASE-TRAIN-STATE.md](./RELEASE-TRAIN-STATE.md) — operational pointer only; **not authoritative over git**
4. **This document** — master execution program
5. Per-train execution plans (`release-trains/*.md`)
6. Public [ROADMAP.md](../../ROADMAP.md) — directional, not a delivery guarantee

---

## 3. Historical baseline — v1.4.0 capability inventory

**Published baseline (2026-06-12):**

| Package | Version | npm |
|---------|---------|-----|
| `agent-inspect` | 1.4.0 | public (root tarball) |
| `@agent-inspect/langchain` | 1.4.0 | public |
| `@agent-inspect/tui` | 1.4.0 | public |
| `@agent-inspect/core` | 0.1.0 | private |
| `@agent-inspect/cli` | 0.1.0 | private |

**Root export surface:** single `"."` export only — no subpaths (`/advanced`, `/logs`, `/exporters`, `/persisted`).

**Root runtime dependencies:** `chalk`, `nanoid`, `commander` only.

**CLI commands (v1.4.0):** `list`, `view`, `clean`, `logs`, `tail`, `export`, `diff`, `timeline`, `stats`, `search`

**Missing for v1.5.0 train:** `what`, `report`, `cohort`, `check`, `assert`

**v0.1 / v0.2 read-write reality:**

- **Write path:** `packages/core/src/storage.ts` enforces `schemaVersion: "0.1"` only
- **v0.2:** Types, validators, converters, in-memory tree bridge exist; fixtures in `fixtures/traces-v0.2/`; **no CLI command reads v0.2 JSONL today**
- **Report functionality:** none
- **Structured logs:** separate `logs`/`tail` parser path, not unified with trace read pipeline

**Framework / reporter packages shipped:** `@agent-inspect/langchain`, `@agent-inspect/tui` (optional)

**Not present:** `@agent-inspect/ai-sdk`, OpenAI Agents, Mastra, LangGraph, Vitest, Jest, explain packages

**CI validation:** `typecheck`, `test:coverage`, `fixtures:check`, `recipes:check`; release gate adds `compat:smoke`, `pack:smoke`, changesets

---

## 4. Published release sequence

This historical sequence is superseded for post-v1.5.0 work. Current ordering lives in [ROADMAP-V1.6-TO-V3.md](./ROADMAP-V1.6-TO-V3.md). Trains still ship in order and publish only after explicit maintainer release confirmation.

| Release | Primary scope |
|---------|---------------|
| **v1.5.0** | API subpath boundary, trace vocabulary RFC, `what`/`report`, canonical dual-format read path, token metadata on persisted events |
| **v1.6.0** | Superseded: runtime foundation and universal trace ingestion now come before adapters |
| **v1.7.0** | Framework adapters: AI SDK, OpenAI Agents, Mastra, LangGraph (extend langchain patterns first) |
| **(conditional)** | Explain experiment — no version until maintainer approves scope |
| **v1.8.0** | `@agent-inspect/vitest`, `@agent-inspect/jest` reporters; `cohort`, `check`, `assert` |
| **v1.9.0** | Standards hardening (OpenInference / conformance fixtures) |
| **v2.0.0** | Stable API reset, unified write format, v0.1 remains readable |

**OTLP HTTP sink:** exploratory post-v2 — not in v1.9.0 scope.

---

## 5. Internal milestones inside v1.5.0

Former standalone planning items **v1.4.1** and **v1.4.2** are **internal milestones**, not separate npm releases.

| Milestone | Former label | Delivered in chunk(s) |
|-----------|--------------|---------------------|
| **M1** | v1.4.1 API boundary | Chunk 1–2: inventory + non-breaking subpath exports |
| **M2** | v1.4.1 trace vocabulary | Chunk 3: vocabulary RFC + schema decision |
| **M3** | v1.4.2 reports | Chunk 4–6: `what`, `report`, adoption recipes |
| **M4** | v1.5.0 read path | Chunk 7–8: canonical dual-format read + CLI migration |

Detail: [release-trains/V1.5.0-EXECUTION-PLAN.md](./release-trains/V1.5.0-EXECUTION-PLAN.md)

---

## 6. Manual intervention gates

| Gate | When | Maintainer actions |
|------|------|-------------------|
| **A — Planning** | Before first implementation chunk of a train | Review planning docs; commit; push; confirm commit hash and branch for implementation |
| **B — Per-chunk** | After each chunk completes validation | Review diff; commit one chunk; confirm before next chunk |
| **C — Train review** | All chunks done, before release prep | Full train review; approve release-readiness doc |
| **D — Release prep** | Before version bump / publish | Changeset review; explicit publish instruction; tag + npm publish via CI |

**Cursor default:** stop at Gate A on first program run (planning only). Never commit, push, tag, or publish unless explicitly instructed.

---

## 7. Chunk policy

- One **commit-sized chunk** per Cursor session (or maintainer PR)
- Each chunk has: goal, in/out scope, files, tests, validation level, suggested commit message
- **Gate B** after every runtime chunk; docs-only chunks still get maintainer review
- No version bump or changeset until Gate D
- No starting chunk N+1 until chunk N is committed (or explicitly waived by maintainer)

---

## 8. Validation matrix

Reuse existing scripts only — no new CI infrastructure required.

| Change type | Commands |
|-------------|----------|
| **Docs only** | `pnpm typecheck`, `pnpm test`, `git diff --check` |
| **Fixtures / examples** | above + `pnpm fixtures:check`, `pnpm recipes:check` |
| **Runtime / core** | `pnpm build`, `pnpm typecheck`, `pnpm test`, `pnpm test:coverage`, `pnpm size`, `pnpm test:all`, `pnpm pack:smoke` |
| **Export / package surface** | above + `pnpm compat:smoke`, `npm pack --dry-run` |
| **CLI touched** | above + `node packages/cli/dist/index.cjs --help` |
| **Release train (Gate D)** | frozen lockfile install, full matrix above, README/CHANGELOG/ROADMAP alignment |

**Instrumentation safety:** tracing must never throw into user code; failures degrade gracefully.

---

## 9. Release gates (publishable train)

A train is publishable at Gate D only when:

- [ ] README, ROADMAP, CHANGELOG describe shipped version accurately
- [ ] `schemaVersion: "0.1"` traces remain readable (fixture + compat tests)
- [ ] No vendor upload or default network telemetry introduced
- [ ] No unapproved root dependencies (`chalk`, `commander`, `nanoid` only on root)
- [ ] `pnpm compat:smoke` and `pnpm pack:smoke` pass
- [ ] SECURITY.md and redaction docs match behavior
- [ ] Changeset added; maintainer explicitly requests version bump + publish
- [ ] Relevant OSS issues updated or closed with PR links

---

## 10. Post-release verification

After npm publish:

1. Confirm package versions on npm match changeset intent
2. Smoke-install tarball in clean directory (`pack:smoke` pattern)
3. Run one recipe end-to-end if CLI or export surface changed
4. Update [RELEASE-TRAIN-STATE.md](./RELEASE-TRAIN-STATE.md): `trainStatus: published`, `pendingManualGate: null`, next train pointer
5. Archive release-readiness doc; add row to ROADMAP maintainer table

---

## 11. Adoption gates

Before marking a train "adoption ready" in docs:

- At least one **recipe** under `examples/recipes/` demonstrates the new workflow
- Recipe passes `pnpm recipes:check`
- README or dedicated doc links the recipe (not buried in implementation-only paths)

v1.5.0 adoption gate: Chunk 6 recipes for `what`/`report` and dual-format read.

---

## 12. Explain experiment gate

**Explain** (natural-language trace summaries) is **not scheduled** with a version number.

Proceed only when:

- Maintainer explicitly approves scope in a dedicated prompt
- Prototype stays opt-in, local, no vendor upload
- Does not block v1.5.0–v1.8.0 sequence

---

## 13. v2.0 RC policy

- v2.0.0 requires release candidate(s) if breaking API or write-format changes land
- RC publishes as `2.0.0-rc.N` via changeset pre-release mode (maintainer-owned)
- RC checklist: migration guide draft, compat matrix for v0.1 read, conformance fixtures green
- Stable v2.0.0 only after Gate C + D on RC feedback

---

## 14. Resume protocol (future Cursor sessions)

1. Read [RELEASE-TRAIN-STATE.md](./RELEASE-TRAIN-STATE.md) for pointer — then **verify git** (`git log -1`, `git status`, package versions)
2. Read this document and the active train plan (`release-trains/V1.5.0-EXECUTION-PLAN.md`, etc.)
3. Run Phase 0 audit: branch, HEAD, working tree clean, baseline version, gap vs train goals
4. Identify `currentChunk` and `pendingManualGate` from state file; confirm with maintainer if Gate B/C/D pending
5. Execute **one chunk only**; update state file in same PR/session if maintainer requests
6. Stop at the appropriate gate; produce chunk report (files, validation, blockers, next action)

**Never** skip gates or combine chunks without maintainer waiver.

---

## 15. Rollback / failure protocol

| Failure | Action |
|---------|--------|
| Chunk validation fails | Fix forward in same chunk; do not start next chunk |
| Chunk breaks main | Revert chunk commit; document blocker in state file `openBlockers` |
| Train scope creep | Cut to next train; update execution plan before continuing |
| Published regression | Patch release (1.x.y) only for breakage/security; document in CHANGELOG |
| Wrong version published | Maintainer-only npm deprecation/unpublish policy per npm rules; post-mortem in release-readiness doc |

---

## Migration risks (v1.5.0)

| Risk | Mitigation |
|------|------------|
| Root export surface too large for IntelliSense | Chunk 1 inventory + Chunk 2 subpaths without removal |
| CLI commands fork v0.1 parsing | Chunk 7–8 unified read pipeline |
| Breaking ESM/CJS consumers on subpath add | `compat:smoke` + new subpath consumer fixtures in Chunk 2 |
| v1.5.0 train size (4 internal milestones) | Strict chunk stops + Gate B after every commit |
| Framework API uncertainty (v1.6+) | Defer detailed plans; API verification gate at train start |

---

## Related

- [V1.5.0-EXECUTION-PLAN.md](./release-trains/V1.5.0-EXECUTION-PLAN.md)
- [V1.4.0-RELEASE-READINESS.md](./V1.4.0-RELEASE-READINESS.md)
- [UNIFIED-PERSISTED-INSPECT-EVENT.md](../proposals/UNIFIED-PERSISTED-INSPECT-EVENT.md)
