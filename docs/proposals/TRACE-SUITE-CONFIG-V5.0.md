# Trace Suite Config — v5.0.0 RFC

**Status:** Accepted for v5.0.0 train (chunk 0)  
**Audience:** Maintainers, CLI implementers, CI integrators  
**Baseline:** `agent-inspect@4.4.0`  
**Related:** [V5.0.0-EXECUTION-PLAN.md](../implementation/release-trains/V5.0.0-EXECUTION-PLAN.md)

Local trajectory-evaluation layer: define trace suites in `agent-inspect.suite.json` (or `.js`/`.mjs`/`.cjs`) and run deterministic checks in CI without a hosted eval platform.

---

## 1. Problem

Teams need repeatable local/CI validation over existing traces — required tools, duration bounds, observed outcomes — without replaying agents or uploading data.

## 2. Goals

- `agent-inspect.suite.json` config with `name`, `traces`, `cases[]`, optional global `checks` / `eval`, `redactionProfile`, `artifacts`.
- CLI: `suite init`, `validate`, `list`, `run`, `report`.
- Deterministic JSON/Markdown reports; safe artifact writes under `.agent-inspect/suite-runs/`.
- Reuse existing `runTraceChecks` and `@agent-inspect/eval` rules.

## 3. Non-goals

- No hosted dataset platform, prompt registry, LLM judge, or cloud sync.
- No trace schema change; no agent replay.
- TypeScript config files are not executed directly (precompiled JS only, same as `check`/`eval`).

## 4. Config model

```json
{
  "name": "refund-agent",
  "traces": "./fixtures/traces",
  "cases": [
    {
      "id": "outcome-mixed",
      "runId": "outcome-mixed",
      "requireTools": ["retrievePolicy"],
      "forbidTools": ["deleteAccount"],
      "maxDurationMs": 5000,
      "expectedObservations": ["policyShown"]
    }
  ],
  "checks": { "select": ["run.status"] },
  "redactionProfile": "local",
  "artifacts": { "outputDir": ".agent-inspect/suite-runs" }
}
```

Case fields:

| Field | Purpose |
|-------|---------|
| `id` | Stable case id (required) |
| `trace` | Path to trace file (relative to config dir) |
| `runId` | Run id resolved under `traces` directory |
| `input` | Optional fixture path (documentation only; validated if present) |
| `requireTools` / `forbidTools` | Tool usage checks |
| `maxDurationMs` | Run duration bound |
| `expectedObservations` | Outcome names that must be `passed` |

Resolution order: `trace` → `runId` → `id` as run name under `traces`.

## 5. Commands

```bash
agent-inspect suite init
agent-inspect suite validate [--config path]
agent-inspect suite list [--config path]
agent-inspect suite run [--config path] [--json] [--markdown] [-o dir]
agent-inspect suite report [--input result.json] [--format markdown|json]
```

## 6. Security

- Config loading uses the same local import path as `check`/`eval` (user JS only when explicitly referenced).
- Reports and artifacts use structural summaries; no raw prompt/output bodies.
- No network I/O in the suite path.

## 7. Compatibility

Additive config file and CLI commands. Traces without suite configs remain unchanged.
