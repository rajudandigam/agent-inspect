# Patrick message draft — refusal evidence recipe (#331)

**Status:** Draft only — user/maintainer sends. Do not auto-send.

**Context:** Issue https://github.com/rajudandigam/agent-inspect/issues/331

---

Hi Patrick,

Before we write a recipe for **deterministic guardrail refusal + expected non-action**, can you confirm the model you want?

Working assumption (proposal only):

1. Synthetic local run shows a guardrail refusal / blocked action.
2. Evidence packages the visible refusal outcome and asserts the forbidden tool/action did **not** run.
3. No new persisted event type, check preset, or #321 provenance fields in this first recipe — caller-owned records + existing TraceFacts/check surfaces only.

If that matches, we will draft the recipe under `examples/recipes/` after your OK. If you want a different shape (e.g. contract-first vs check-first), say which.

Thanks,
Raju
