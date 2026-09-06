# AgentInspect Canonical Roadmap (permanent)

**Baseline:** `agent-inspect@6.19.0` (Version Packages `#357` on `main`)
**Roadmap horizon:** `6.19.0 → conditional 6.19.1 → 6.20.0 → 6.21.0 → conditional 6.22.0`
**Status:** Active canonical roadmap (permanent path; supersedes version-named roadmap seeds)
**Primary objective:** Close capability-truth gaps, eliminate fail-open deterministic check behavior, keep release integrity green, align high-confidence redaction with verify-safe, make framework preview capture useful without weakening local-first safety, support arbitrary persisted agent-event sources through the existing reader architecture, and make deterministic contracts flexible enough for legitimate alternate agent paths
**Persisted trace schema:** remains `1.0`
**Package policy:** no new public packages before the conditional v7 decision
**Network policy:** no new default network behavior
**Product boundary:** local-first and customer-owned; no maintainer-hosted SaaS
**Named train:** `agentinspect-feedback-integrity-v6.17.5-to-v6.22`
**Active plan:** [active/NEXT-RELEASES.md](./active/NEXT-RELEASES.md)

---

## 1. Executive decision

The `6.16.0`–`6.17.7` line delivered repository health, Evidence UX, public proof, redaction/verify-safe parity, and DX truth. Remaining concentration: release hygiene, destructive CLI correctness, MCP untrusted-trace boundary, differentiation proof, adapter capture parity, redaction workflow, and future contract semantics.

The canonical release sequence is:

```text
6.17.5  Release integrity, capability truth, and adversarial check-engine integrity  (published)
6.17.6  Security containment + dependency remediation  (published)
6.17.7  High-confidence redaction/verify-safe parity + DX truth + Evidence recipe  (published)
6.17.8  Closeout + trust-boundary: #340 clean --keep; MCP untrusted-trace; tracker truth  (published)
6.17.9  Conditional: verified security or compatibility corrections only

6.18.0  Safe adoption and differentiation (same-output/wrong-path; no-key adapters; preview; redact UX)  (published)
6.18.1  Reserved 6.18 corrections only

6.19.0  External evidence + derived failure semantics (TraceReader authoring; failure roles; interop)  (Version Packages #357 on main; confirm npm)
6.19.1  Reserved 6.19 corrections only

6.20.0  Alternative valid paths and causal / strict ordering modes  (next — #308/#315/#309)
6.20.1  Reserved contract compatibility patch only

6.21.0  Actor-scoped contracts and outcome provenance requirements  (#320/#321)
6.21.1  Reserved multi-agent contract patch only

6.22.0  Conditional design-partner recipes (#331 design confirmed; existing APIs only; not yet implemented)
6.22.x  Stability, external verification, and adoption
```

No major version is required. No new trace schema. No TrueForge-specific package. No full-content capture mode. No general temporal/workflow DSL.

The product identity remains:

> **AgentInspect is the local evidence debugger and trajectory-test toolkit for TypeScript agents: see what the agent did, fail CI when it follows the wrong path, and keep a share-checked artifact—without an account, collector, or default upload.**

---

## 2. Active train — v6.17.5 release integrity + check integrity

**Goal:** Restore repository green status, make adapter limitations impossible to misunderstand, and eliminate fail-open behavior in the deterministic check layer.

### 2.1 Public-truth atomicity

- Root `package.json` version is authoritative for mechanical surfaces.
- `pnpm public-truth:sync` updates README / ROADMAP / docs README / PUBLIC-PRODUCT-FACTS / website product metadata / AI assets / demo provenance version fields.
- Claim ledger uses a **claim-content digest** so patch bumps do not require fabricated human attestation when claim text is unchanged.
- Changesets Version Packages runs sync before public-truth validation.

### 2.2 Demo verification fail-closed

`demo:verify` must fail with `AI_DEMO_VERIFY_CLI_MISSING` when the CLI artifact required for Evidence verification is absent. No silent skip.

### 2.3 Tail truncation recovery

When a watched file shrinks below the saved offset, reset offset, clear partial-line buffer, keep the session active. Do not claim full inode-aware rotation unless implemented.

### 2.4 Visible preview capability truth

AI SDK and OpenAI Agents accept `capture: "preview"` but persist metadata-only. Emit one visible `AI_ADAPTER_PREVIEW_NOT_AVAILABLE` warning per instance. **Do not** implement preview capture in 6.17.5.

### 2.5 TraceContract ordering documentation

`tools.requiredOrder` expands to adjacent pair checks comparing **first occurrences** (start/encounter order). Document; do not change the algorithm. GitHub #308 first-occurrence docs/tests land here; strict `requiredOrderMode` implementation is deferred to 6.20.0.

### 2.6 Stale wording cleanup

Replace obsolete “evolves during v1.x” current-API wording with support-level language. Do not rewrite historical changelogs.

### 2.7 Issue reconciliation (chunk 6.17.5-8)

Map GitHub issues #308–#311 to release trains. #310 closed after visible-warning acceptance.

### 2.8 Adversarial check-engine integrity (chunks 6.17.5-9 … 6.17.5-17)

Fail-closed deterministic gate hardening:

| Area | Deliverable |
| --- | --- |
| Strict config | Unknown keys / invalid values / effectless `--config` reject |
| Rule evidence | `ruleExecutions` + `summary.rulesEvaluated`; zero rules → error |
| Ordering | Unique contract order IDs; TraceContract `requiredOrder` implies presence; overlap warning |
| Tool policy | Forbidden/required/allowed/counts observe running invocations |
| Observations | CLI `--fail-on-observation` requires at least one outcome |
| Durability docs | Diagnostic evidence ≠ event-sourced / WAL runtime |

**Do not** implement in 6.17.5: preview capture, `alternatives.anyOf`, `requiredOrderMode`, actor scope, handoff digests, outcome provenance enforcement.

---

## 2A. Issue traceability (GitHub → release)

```text
#310 → 6.17.5 (closed — visible warning)
#308 → 6.17.5 docs/tests + 6.20.0 requiredOrderMode (roadmap-now; stay open until modes ship)
#311 → 6.18.0 (adapter preview — shipped with 6.18.0)
#309 → 6.20.0 alternatives.anyOf (roadmap-now; stay open)
#315 → 6.20.0 PR for causal requiredOrder modes (keep open)
#320 → 6.21.0 actor-scoped TraceContracts (roadmap-next; stay open)
#321 → 6.21.0 outcome provenance (roadmap-next; stay open)
#331 → conditional 6.22.0 (design confirmed; existing APIs only; not implemented; roadmap-future)
```

---

## 3. Later trains (planned / conditional)

| Release | Theme | GitHub | Notes |
| --- | --- | --- | --- |
| **6.17.7** | Redaction/verify-safe parity + DX truth + Evidence recipe | #327/#333; #316/#335 | Published |
| **6.17.8** | Closeout + trust-boundary | #340; MCP untrusted-trace; #297 if green | Published |
| **6.17.9** | Conditional corrective patch | — | Only verified security/compat defects |
| **6.18.0** | Safe adoption and differentiation | #311, #213, #307, #328, #329, #330 | Published |
| **6.19.0** | External evidence + derived failure semantics | #354/#355 | Version Packages `#357` on main; confirm npm |
| **6.20.0** | `alternatives.anyOf` + ordering modes | #309, #308/#315 | Next train (`roadmap-now`) |
| **6.21.0** | Actor-scoped contracts + outcome provenance | #320, #321 | Scheduled (`roadmap-next`) |
| **6.22.0** | Conditional design-partner recipes | #331 | Design confirmed; existing APIs only; not yet implemented (`roadmap-future`) |

### 3.1 v6.18.0 — adapter capture parity (#311)

**Goal:** Make `capture: "preview"` persist bounded, redacted preview fields across AI SDK, OpenAI Agents, and LangChain adapters with shared diagnostics.

**Acceptance (17 bullets):**

1. Shared capture contract documented (metadata-only default; preview opt-in).
2. `capture: "preview"` persists bounded preview fields when source data is available.
3. `capture: "metadata-only"` remains default; no behavior regression.
4. Diagnostics history retained (`lifecycleWarnings`, `lastWarning`).
5. Optional `onDiagnostic` callback for adapter consumers.
6. Bounded preview helper shared across adapters (max chars, field selection).
7. AI SDK adapter parity with shared contract.
8. OpenAI Agents adapter parity with shared contract.
9. LangChain adapter parity with shared contract.
10. Functional `redactionProfile` honored when preview is enabled.
11. Functional `maxPreviewChars` honored when preview is enabled.
12. `AI_CAPTURE_FIELD_UNAVAILABLE` diagnostic when a requested preview field cannot be sourced.
13. Writer flush rules unchanged; preview fields respect serialized-size limits.
14. Conformance tests across all three adapters.
15. No raw full-content persistence by default.
16. No root API leak; capabilities remain on adapter subpaths.
17. Remove or downgrade `AI_ADAPTER_PREVIEW_NOT_AVAILABLE` when preview is actually implemented.

### 3.2 v6.19.0 — external persisted-event readers

**Goal:** Authoring guidance and TrueForge receipt recipe for arbitrary persisted agent-event sources through the existing reader architecture.

Pipeline:

```text
foreign source JSON
→ TraceReader
→ PersistedInspectEvent / TraceReadResult
→ optional TraceTransform
```

A TraceTransform is **not** the decoder for raw vendor JSON. No official TrueForge package.

### 3.3 v6.20.0 — alternative valid paths (#309 + #308)

**Goal:** Deterministic contract composition for legitimate alternate agent paths without weakening local-first safety.

**Planned APIs (document only until implementation):**

#### `alternatives.anyOf` (#309)

- Shape: one level of alternative path groups; each group is a deterministic valid path.
- Evaluation: contract passes when **one** alternative group fully satisfies its rules.
- Constraints: no nested `anyOf`, no predicates, no runtime branching DSL.

#### `requiredOrderMode` (#308)

| Mode | Semantics |
| --- | --- |
| `"first-occurrence"` (default, shipped) | Legacy first-start / encounter ordering among present tools |
| `"happens-before"` (planned) | First matching before-event must **end** before first matching after-event **starts** |
| `"all-occurrences"` (planned) | Every before-event must end before every after-event starts |

**Contributor note:** @HsienW volunteered on #308 for `requiredOrderMode` implementation. API shape requires maintainer approval before external PR lands.

### 3.4 v6.21.0 — actor-scoped contracts and outcome provenance

**Goal:** Multi-agent session contracts that select a specific actor, plus trustworthy observation requirements.

- Scope selectors based on explicit metadata: `runId`, `subAgentId`, `groupId`, `workflowStep`, or explicit subtree/root event where supported
- Zero selector matches → error; ambiguous single-actor selector → error
- No timestamp-only actor inference
- Outcome provenance: require `method` and/or `evidence`; optionally require referenced event ID in same run/session

Declared-versus-enforced control evidence conventions remain design-partner gated (see 6.22.0).

### 3.5 v6.22.0 — conditional design-partner recipes

Only when external partners validate need:

- Digest-backed producer/consumer handoff evidence (no raw transferred content by default)
- Declared-control versus enforced-control conventions
- MCP retry / duplicate-side-effect design-partner fixture (after confirming whether the first retryable failure occurs after the side effect)
- CI promotion-envelope recipe for external control planes (after zevqora / equivalent validation)

Historical `6.16.x`–`6.17.1` repository-health and Evidence UX work remains summarized in [history/ROADMAP-HISTORY.md](../history/ROADMAP-HISTORY.md) and Git tags.

---

## 4. Non-negotiable boundaries

- Persisted schema remains `1.0`; v0.1 and v0.2 traces remain readable
- No new public package; no root/core framework dependency leak
- No account, collector, hosted service, default upload, or hidden telemetry
- Metadata-only remains the default adapter capture mode
- Instrumentation failures never replace application failures
- Evidence v2 integrity semantics remain compatible
- AgentInspect traces are diagnostic evidence, not an event-sourced application runtime
