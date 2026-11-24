# PROPOSED — Repeated-run acceptance (#527 / Frank N6)

> **Status:** design only. **No public API, CLI flag, or schema change is authorized by this note.**
> Source: [Discussion #527](https://github.com/rajudandigam/agent-inspect/discussions/527) (proposal + both follow-up comments). Contributor-reported 15/20 is real; illustrative 20/20 baseline is hypothetical.

## Problem

`check --dir --group` / `--session` already evaluates every selected run and fails if any run fails (100% bar). `gate --max-error-rate` counts errored runs, not contract failures. Teams that want a **threshold below 100%** (or a confidence-bound / baseline-drop rule) have no first-class surface.

Recipe-local `TraceCheckRule`s already cover Frank’s refund ceiling and entity-bind cases (N3). This design is only about **batch acceptance** over repeated runs.

## Non-goals

- Do not weaken the default: absent `acceptance`, any failing run still fails the check.
- Do not reuse `gate --max-error-rate` as a contract pass-rate.
- Do not average away hard safety failures unless a rule explicitly opts into rate aggregation.
- Do not ship Wilson/Newcombe math, CLI flags, or config schema until maintainer selects this chunk.
- General conditional/value operators remain separate (see [PARKED-DESIGNS.md](./PARKED-DESIGNS.md)).

## Sampling unit and cohort

| Term | Meaning |
| --- | --- |
| **Run** | One saved AgentInspect run (one `runId` / JSONL file) under the existing `--dir` / `--session` / `--group` selection. |
| **Cohort** | The fixed set of runs in scope for one acceptance evaluation. Selection matches today’s check scoping; `--dir` alone may define a cohort only when every included run is an intentional member (document; prefer explicit `groupId`/`sessionId`). |
| **Baseline** | A previously saved `check --json` result used only for optional drop detection — never silently re-executed as “truth.” |
| **Paired vs independent** | Interval math assumes independent Bernoulli trials. Fixed-seed or cached-model reruns are **not** independent; docs must say so. Paired methods are out of scope for v1 of this design. |

## Observed rate vs confidence-bound acceptance

Sketch (illustrative only — not a committed config shape):

```json
{
  "acceptance": {
    "minRuns": 20,
    "minPassRate": 0.95,
    "basis": "observed",
    "interval": { "method": "wilson", "level": 0.95 },
    "hardFailRuleIds": ["tool.arguments", "secret.leak"],
    "drop": {
      "baseline": "baselines/nightly-refund.json",
      "method": "newcombe",
      "detect": 0.15
    }
  }
}
```

| Field | Semantics |
| --- | --- |
| `minRuns` | Fewer in-scope runs → exit **2** (“not enough runs to judge”). |
| `basis: "observed"` | Pass when `passed / total >= minPassRate`. |
| `basis: "lower-bound"` | Pass when the interval’s lower bound clears `minPassRate`. Always print the interval either way. |
| `hardFailRuleIds` | Findings from these rule IDs in **any** run fail the batch even if the rate clears the bar (answers Frank’s Q1: a ceiling/secret hit must not hide behind 19/20). |
| `drop` | Optional: flag when Newcombe interval for (current − baseline) sits wholly below zero; underpowered fall vs `detect` is a separate warning, not a silent pass. |

Default recommendation if ever shipped: **`basis: "observed"`**, always print Wilson interval, keep hard-fail allowlist empty unless configured (strict teams opt in).

## Denominator and ungradeable runs

| Outcome | Count |
| --- | --- |
| Contract pass | numerator + denominator |
| Contract fail | denominator only (failure) |
| Checker/runtime error | denominator as failure (same as today) |
| Ungradeable / unreadable trace | **excluded from rate denominator**; counted on its own line |
| Ungradeable share > 20% of cohort | batch **incomplete** (exit 2), not a green pass |

Do not average ungradeable into “pass.” Missing evidence is not success.

## Numerical controls (from Nov 22 / #527 comments)

| Scenario | Expected judgment |
| --- | --- |
| 15/20 pass, `minPassRate: 0.95`, `basis: observed` | **fail** (75% < 95%) |
| 19/20 pass, one hard-fail ceiling hit, `hardFailRuleIds` includes that rule | **fail** even though 0.95 observed |
| 19/20 pass, soft tool.usage miss only, no hard-fail ids | **pass** at observed 0.95 |
| 20/20, `basis: lower-bound`, bar 0.95 | **fail** (Wilson lower ≈ 83.9%) |
| < `minRuns` in scope | exit **2** |
| >20% ungradeable | incomplete / exit **2** |
| Hypothetical 20/20 baseline vs real 15/20, Newcombe wholly below 0 | drop **flag** (illustrative; not a shipped gate) |

Power note (contributor-derived, not a product claim): seeing a 15-point drop from a 100% baseline at ~80% power needs ~48 runs per side under a two-proportion formula. Document underpowered warnings; do not invent significance theater.

## Evidence of a baseline decline

- Compare only against an explicit saved baseline artifact.
- Print both Wilson intervals and the Newcombe difference interval.
- If multiple per-rule rates are tracked, apply a multiple-comparison correction (e.g. Holm) before claiming a drop — optional later; v1 can stay batch-level only.
- Decline evidence is a **finding / warning class**, not automatic rewrite of historical baselines.

## Relationship to shipped work

- N3 refund identity / approval-before-action: recipe-local; does **not** implement acceptance.
- `check --group` / `runResults`: sufficient for 100% bars today.
- Parked: “Repeat-run contract pass-rate threshold” in [PARKED-DESIGNS.md](./PARKED-DESIGNS.md).

## Maintainer decisions still required before any API

1. Exact config surface (`acceptance` on contract vs separate check config).
2. Default `hardFailRuleIds` (empty vs safety-oriented builtins).
3. Whether `--dir` without group/session is a valid cohort.
4. Whether drop detection ships with v1 or stays a later additive.

## Stop line

Until those decisions land, keep this file as the design record. Do not open a Changeset, root export, or CLI flag for repeated-run acceptance.
