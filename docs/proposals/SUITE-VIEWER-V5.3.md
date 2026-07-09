# Suite Viewer — v5.3.0 RFC

**Status:** Accepted for v5.3.0 train (chunk 0)  
**Baseline:** `agent-inspect@5.2.0`  
**Related:** [V5.3.0-EXECUTION-PLAN.md](../implementation/release-trains/V5.3.0-EXECUTION-PLAN.md)

Local read-only viewer for suite and workspace evidence.

---

## 1. Goals

- `agent-inspect viewer --suite` / `--workspace` (alias of read-only localhost server)
- Sections: suite list, case status, failure diff, timeline, tool path, observations, guardrails/redaction status, CI artifacts, bundle export hints
- Localhost default (`127.0.0.1`); GET-only routes

## 2. Non-goals

- No hosted viewer, no write/mutation, no upload

## 3. Model

Viewer extends `@agent-inspect/viewer` with suite run data (`runSuite`) and workspace status (`getWorkspaceStatus`). JSONL remains canonical.

## 4. Security

Read-only GET routes; structural summaries only; localhost by default.
