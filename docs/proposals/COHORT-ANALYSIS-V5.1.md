# Cohort Analysis v2 — v5.1.0 RFC

**Status:** Accepted for v5.1.0 train (chunk 0)  
**Baseline:** `agent-inspect@5.0.0`  
**Related:** [V5.1.0-EXECUTION-PLAN.md](../implementation/release-trains/V5.1.0-EXECUTION-PLAN.md)

Compare groups of local traces to detect regressions across baseline/candidate cohorts.

---

## 1. Goals

- `agent-inspect cohort` with `--baseline` / `--candidate` labels (metadata key, default `cohort`)
- `--group-by model | session | group | metadata.<key>`
- Metrics: errorRate, duration, toolChoice, toolOrdering, llmCallCount, tokenUsage, retryCount, observationFailure, guardrailFailure, circuitViolation, redactionWarning
- Outputs: `cohort-results.json`, `cohort-summary.md`, `cohort-report.html`

## 2. Non-goals

- No hosted analytics or upload
- No provider cost engine

## 3. Model

Runs are loaded from a local trace directory. Each run's `run_started.metadata` supplies cohort labels and grouping keys. Metrics are computed read-only from trace files; no agent replay.

## 4. Security

Structural summaries only; no raw prompt/output bodies in reports.
