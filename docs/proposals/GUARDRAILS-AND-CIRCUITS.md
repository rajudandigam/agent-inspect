# Guardrails and circuits — v2.5.0 RFC

**Status:** Accepted for v2.5.0 train (chunk 0) — design only; no runtime implementation in this chunk  
**Audience:** Maintainers, adapter authors, check/eval implementers  
**Baseline:** `agent-inspect@2.4.0`  
**Related:** [TRACE-CHECKS.md](./TRACE-CHECKS.md) · [REDACT-PACKAGE.md](./REDACT-PACKAGE.md) · [SAFE-TRACE-SHARING.md](../SAFE-TRACE-SHARING.md) · [V2.5.0-EXECUTION-PLAN.md](../implementation/release-trains/V2.5.0-EXECUTION-PLAN.md)

This RFC defines **deterministic local** guardrail and circuit-breaker contracts before v2.5 runtime work (`@agent-inspect/guardrails`, `@agent-inspect/circuit`, check/eval integration). It does **not** introduce remote policy engines, LLM judges, compliance certification, or automatic remediation.

---

## 1. Problem

Agent systems repeat the same safety failures: banned phrases in outputs, PII in tool arguments, prompt-injection patterns, runaway tool loops, and unbounded retries. AgentInspect already provides:

- deterministic **checks** and **eval** over local traces;
- **`@agent-inspect/redact`** for key/pattern-based findings;
- structural rules (orphans, cycles, guardrail signal events).

What is missing is a **reusable, opt-in library** for evaluating candidate text/JSON at decision points and for detecting loop/retry patterns in traces — without claiming compliance or calling remote services.

---

## 2. Goals (v2.5.0)

- Two optional public packages: `@agent-inspect/guardrails` and `@agent-inspect/circuit`.
- **Deterministic-first** behavior: same input → same result; no network I/O by default.
- **Evidence-rich results** linkable to check/eval findings and optional trace events.
- **Redact reuse** for PII-style guardrails (no duplicate detector stacks).
- **Non-enforcement by default** — utilities return results; callers decide whether to block, warn, or emit trace events.
- **Old trace readability** unchanged; no schema version bump required.

## 3. Non-goals (v2.5.0)

- No remote policy engine, hosted rules, or LLM-as-judge.
- No compliance certification language (GDPR/HIPAA/SOC2).
- No automatic remediation, kill switches without explicit caller config, or framework monkey patching.
- No production APM, fleet aggregation, or alerting platform.
- No root/core dependency on guardrails/circuit packages.
- No raw chain-of-thought capture.

---

## 4. Package boundaries

| Package | Owns | Must not own |
| ------- | ---- | ------------ |
| `@agent-inspect/guardrails` | text/JSON guardrail evaluators, result model, built-in rules | trace reading, CLI, provider SDKs, network |
| `@agent-inspect/circuit` | loop/retry/repetition analyzers over trace facts or counters | trace mutation, automatic process kill |
| `agent-inspect/checks` | adapters that map guardrail/circuit results to `TraceCheckResult` | duplicate guardrail logic |
| `@agent-inspect/eval` | eval rules consuming guardrail/circuit adapters | LLM scoring |
| `agent-inspect` CLI | flags wiring check/eval to new rules | default enforcement |

Both packages are **optional**, publishable in the v2.5 linked set when release prep authorizes.

---

## 5. Guardrail result model

```ts
export type GuardrailStatus = "pass" | "fail" | "warn";

export type GuardrailSeverity = "error" | "warning" | "info";

export interface GuardrailEvidence {
  path?: string;
  preview?: string;
  ruleId: string;
  match?: string;
  detector?: string;
}

export interface GuardrailResult {
  ruleId: string;
  status: GuardrailStatus;
  severity: GuardrailSeverity;
  message: string;
  evidence: GuardrailEvidence[];
}

export interface GuardrailRunResult {
  ok: boolean;
  results: GuardrailResult[];
}
```

**Semantics:**

- `ok` is `true` when no result has `status: "fail"` and severity `error` (warnings may still be present).
- `preview` fields are bounded; full payloads are never required in results.
- Results are **advisory** unless caller maps `fail` to thrown errors or trace events.

### 5.1 Built-in guardrail kinds (v2.5)

| Rule id | Input | Behavior |
| ------- | ----- | -------- |
| `guardrail.banned-phrase` | string or JSON string fields | Case-insensitive phrase list match |
| `guardrail.pii-leak` | JSON-like value | Delegate to `@agent-inspect/redact` findings |
| `guardrail.unsafe-tool-args` | tool name + args object | Blocked tool names + oversize/nested depth |
| `guardrail.prompt-injection` | string | Deterministic pattern list (not ML) |
| `guardrail.structured-output` | unknown + JSON Schema subset | Required keys, types, enums |
| `guardrail.oversize-output` | string or serialized JSON | Max length / max depth |
| `guardrail.required-json-shape` | unknown | Must parse as object with required keys |

All built-ins accept explicit options; defaults are conservative and local.

### 5.2 Trace event emission (optional)

When configured, guardrails MAY emit additive inspect events (no schema break):

```ts
{
  name: "guardrail:evaluated",
  attributes: {
    ruleId: string;
    status: GuardrailStatus;
    severity: GuardrailSeverity;
    message: string;
    evidenceCount: number;
  }
}
```

Emission is **caller-controlled** (`emitTraceEvents?: boolean`). Core writers are not modified by default.

---

## 6. Circuit result model

```ts
export type CircuitStatus = "closed" | "open" | "warn";

export interface CircuitEvidence {
  ruleId: string;
  count?: number;
  threshold?: number;
  toolName?: string;
  runId?: string;
  eventId?: string;
  path?: string;
}

export interface CircuitResult {
  ruleId: string;
  status: CircuitStatus;
  severity: "error" | "warning" | "info";
  message: string;
  evidence: CircuitEvidence[];
}

export interface CircuitRunResult {
  ok: boolean;
  results: CircuitResult[];
}
```

**Semantics:**

- `closed` — pattern within configured bounds (healthy).
- `open` — threshold exceeded (caller may stop work).
- `warn` — approaching threshold or ambiguous signal.

Circuits analyze **local counters or trace projections**; they do not mutate application state.

### 6.1 Built-in circuit kinds (v2.5)

| Rule id | Signal | Behavior |
| ------- | ------ | -------- |
| `circuit.same-tool-repetition` | tool call sequence | Same tool name repeated ≥ N times |
| `circuit.same-args-repetition` | tool args hash | Same tool+args repeated ≥ N times |
| `circuit.max-loop-iterations` | step/run counts | Iteration counter exceeds max |
| `circuit.max-retries` | retry metadata / attempts | `attempt` or retry events exceed max |
| `circuit.tool-timeout` | tool span duration | Duration exceeds configured ms |
| `circuit.runaway-llm-loop` | LLM call count in run | LLM steps exceed max without terminal step |
| `circuit.excessive-branch-width` | parallel children | Branch width at any node exceeds max |

Trace-based circuits consume `TraceCheckFacts`-compatible projections (events + trees) without re-parsing files.

---

## 7. Check and eval integration

### 7.1 Check adapters

New optional rules behind `agent-inspect/checks` (experimental):

- `createGuardrailCheckRule(options)` — run configured guardrails against selected run metadata/output attributes.
- `createCircuitCheckRule(options)` — run circuit analyzers over trace facts.

Rules return standard `TraceCheckFinding` with evidence paths pointing at events/attributes.

### 7.2 Eval integration

`@agent-inspect/eval` gains optional rule factories mirroring check adapters so `agent-inspect eval` and CI reporters share semantics.

### 7.3 CLI

```bash
agent-inspect check <trace> --guardrails banned-phrase,pii-leak
agent-inspect check <trace> --circuit max-retries,same-tool-repetition
```

Flags are **opt-in**; default `check` behavior unchanged without flags.

Exit codes follow existing check semantics: failures on `error` severity findings unless `--warn-only`.

---

## 8. Safety and honesty

- Guardrails and circuits are **best-effort local utilities**, not compliance tools.
- Pattern lists and heuristics produce false positives and false negatives.
- PII guardrails reuse redact detectors — same limitations as [SAFE-TRACE-SHARING.md](../SAFE-TRACE-SHARING.md).
- Circuits detect patterns in traces or explicit counters; they cannot prevent all runaway behavior without caller enforcement.

---

## 9. Compatibility

- No persisted schema version change.
- No new required fields on existing events.
- Packages are optional; root `agent-inspect` does not depend on them at runtime unless user imports or enables CLI flags.
- ESM/CJS/declarations match other `@agent-inspect/*` packages.

---

## 10. v2.5 chunk mapping

| Chunk | Deliverable |
| ----- | ----------- |
| 0 | This RFC + doc disclaimers |
| 1 | `@agent-inspect/guardrails` package |
| 2 | `@agent-inspect/circuit` package |
| 3 | check/eval/CLI integration |
| 4 | recipes + release readiness |

---

## 11. Open questions (deferred)

- Shared config file format for guardrail/circuit rule sets (YAML deferred per v1.8 checks RFC).
- Runtime inline guardrails inside `step()` — out of scope for v2.5; trace/check-time only unless a later train promotes it.
