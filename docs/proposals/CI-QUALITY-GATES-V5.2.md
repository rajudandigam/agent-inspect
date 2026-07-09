# CI Quality Gates — v5.2.0 RFC

**Status:** Accepted for v5.2.0 train (chunk 0)  
**Baseline:** `agent-inspect@5.1.0`  
**Related:** [V5.2.0-EXECUTION-PLAN.md](../implementation/release-trains/V5.2.0-EXECUTION-PLAN.md)

Deterministic CI gate for agent behavior over local traces and suite configs.

---

## 1. Goals

- `agent-inspect gate` with suite-driven (`--suite`) and flag-driven thresholds
- Thresholds: `--max-error-rate`, `--max-p95-duration`, `--forbid-tool`, `--require-observation`
- Outputs: `gate-results.json`, `gate-summary.md`, `gate-report.html`, `junit.xml`, `github-step-summary.md`
- Stable exit codes: `0` pass, `1` gate failed, `2` invalid config, `3` trace read failure, `4` unsupported format

## 2. Non-goals

- No hosted CI service or upload
- No agent replay or provider calls

## 3. Model

Gate evaluation is read-only over existing traces. Suite mode delegates to the v5.0 suite engine. Flag mode scans a trace directory and evaluates aggregate/per-run rules. Results are structural summaries only.

## 4. Security

No raw prompt/output bodies in reports. Local file writes only when `--output` is set.
