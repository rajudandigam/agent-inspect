# CHUNK 12A — Issue #491 valid-variable-paths audit

**Date:** 2026-10-29  
**Starting commit:** `cb74e6b1`  
**Issue:** [#491 Recipe: allow valid variable agent paths under one explicit contract](https://github.com/rajudandigam/agent-inspect/issues/491)  
**Mode:** Evidence mapping + controls run; **no issue close** (maintainer closure recommendation only)

## Fixture / recipe location

| Artifact | Path |
| --- | --- |
| Recipe entry | `examples/recipes/valid-variable-paths/src/index.ts` |
| Operator docs | `examples/recipes/valid-variable-paths/README.md` |
| Golden stdout | `examples/recipes/valid-variable-paths/expected-output.txt` |
| Registration | `scripts/validate-recipes.mjs` (`valid-variable-paths` in `RECIPES`) |
| Related prior work | `examples/starters/broken-agent-debugging/` (`prove-same-output-wrong-path.mjs` — same-output / wrong-path; preserved, not duplicated) |
| Contract docs | `docs/TRACE-CONTRACTS.md` (`steps.orderRelations`, `retry.operations[]`) |

**Run command (clean install after workspace `pnpm install`):**

```bash
AGENT_INSPECT_SILENT=true pnpm --filter agent-inspect-recipe-valid-variable-paths start
```

## Shared contract (live cases)

Defined in recipe `defineTraceContract`:

- `run.requireCompleted` + `allowedStatuses: ["ok"]`
- `tools.required: ["lookup"]`, `tools.forbidden: ["refund"]`
- `steps.orderRelations`: TOOL `lookup` before LLM `answer` (`first-occurrence`)
- `retry.operations[]` on `lookup`: `maxAttempts: 2`, read side-effect, `requireRecoveredFailureVisible`, `requireFailureBeforeRetry`, `retryableErrors` codes `ETIMEDOUT` / `ECONNRESET`, `successfulResultDependency` with `requireExplicitReference: true` on LLM consumer

## Acceptance criteria → evidence → rule IDs

| Criterion (issue / README) | Case ID | Expected | Observed (2026-10-29 run) | Primary rule IDs / mechanisms |
| --- | --- | --- | --- | --- |
| Two valid paths under one contract | V01-lookup-answer | pass | pass | (no failing findings) |
| Optional step allowed | V02-optional-format | pass | pass | Optional `format_optional` LOGIC step; order + dependency still satisfied |
| Forbidden refund despite same answer path | V03-prohibited-refund | fail | fail | `tool.usage` (forbidden `refund`) |
| Missing required lookup | V04-missing-lookup | fail | fail | `tool.usage` (missing required `lookup`) |
| Missing lookup/outcome evidence | V04 (same) | fail | fail | `tool.usage` — violation vs “missing evidence” distinction per issue: demonstrated missing tool, not silent pass |
| Future / wrong-order result use | V05-future-result-ref | fail | fail | `contract.step.orderRelation.0` + `contract.retry.operations.successful-result-dependency` |
| Retry allowlist (failed-then-success) | V06-retry-ok | pass | pass | Retry chain with `ETIMEDOUT`; within `maxAttempts` |
| Non-allowlisted retry error | V06b-non-allowlisted-retry | fail | fail | **`contract.retry.operations.retryable-error`** (asserted in recipe) |
| Retry without prior failure | V06c-retry-without-prior-failure | fail | fail | **`contract.retry.operations.failure-before-retry`** (asserted) |
| Retry ceiling exceeded | V06-retry-excess | fail | fail | **`contract.retry.operations.maxAttempts`** (implicit via excess attempts) |
| Wrong explicit result ref | V07-wrong-result-ref | fail | fail | **`contract.retry.operations.successful-result-dependency`** (asserted) |
| Missing explicit result ref | V08-missing-result-ref | fail | fail | **`contract.retry.operations.successful-result-dependency`** (asserted) |
| Anitesh 7 logical / 14 physical rows, valid pairs | anitesh-seven-safe | pass | pass | `projectLogicalEvents`: 7 logical, 0 `AI_LOGICAL_PAIR_UNMATCHED`; structure-only contract (no toolCallId in metadata) |
| Seven-variant broken path | anitesh-seven-broken | fail | fail | `tool.usage` (forbidden `refund` in embedded JSONL) |

**14-row / 7-logical-event semantics:** Safe variant uses 14 physical JSONL lines (start/complete pairs + run boundaries) projecting to **7 logical events**; recipe throws if logical count ≠ 7 or lifecycle pairs are unmatched.

**Determinism note (issue acceptance):** Rule evaluation over a fixed trace is deterministic; live `inspectRun` cases generate fresh JSONL under `.agent-inspect-runs/<caseId>/` each run. Golden stdout is checked into `expected-output.txt`.

## Controls executed

| Control | Command | Result |
| --- | --- | --- |
| Recipe registry / layout | `pnpm recipes:check` | **PASS** — 64 recipes including `valid-variable-paths` |
| Recipe oracle | `AGENT_INSPECT_SILENT=true pnpm --filter agent-inspect-recipe-valid-variable-paths start` | **PASS** — stdout matches `expected-output.txt` |
| In-recipe assertions | Same run | **PASS** — V07/V08/V06b/V06c ruleId guards; no classification mismatches |

**Not run this chunk (optional release gate):** full `pnpm test`, `pnpm build`, `pnpm repo:health`. Issue acceptance mentions “repository-required gates”; maintainer should run core chunk gate before closure if not already green on main.

## Gaps / non-blocking follow-ups

1. **`examples/recipes/README.md` index** — `valid-variable-paths` is registered in `recipes:check` but not listed in the recipe index table (documentation discoverability).
2. **README template sections** — recipe README is minimal (does not include the full “What this demonstrates / …” block enforced for the older `recipes-smoke` subset).
3. **Committed JSONL fixtures** — traces are generated at runtime (plus inline Anitesh JSONL builder); no checked-in `.jsonl` files under the recipe dir. Acceptable if maintainers treat `expected-output.txt` + contract as the oracle.
4. **Framework comparison** — issue defers Mastra/LangChain pinned executions; not in scope.

## Maintainer closure recommendation

**Recommend closure-ready** for the bounded #491 deliverable: one explicit TraceContract, two passing path variants, forbidden refund and missing/wrong/future dependency failures, retry allowlist semantics, and Anitesh 7-logical / 14-physical fixture — with recipe registered and passing local run + `recipes:check`.

**Before closing:** maintainer acknowledgment of doc index optional follow-up and confirmation that main CI gates are green (this chunk did not re-run full CI).

**Do not close automatically** — maintainer-owned issue per labels.
