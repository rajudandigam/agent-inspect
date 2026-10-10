# Recipe: comparable-cohort-runs

## What this demonstrates

Two **separately executed** deterministic stub workflows measure tool-output and
next-model-input bytes. Commitments are SHA-256 digests of those measured bytes.

A predefined `StageCommitments` object is not evidence of a second invocation.
An `orderId` tool response cannot substantiate a commitment to policy text that
was never returned.

| Case | Expected class |
| --- | --- |
| G01 same policy bytes enter both model inputs | `equivalent_stage_inputs` |
| G02 policyVersion 1→2 enters next model input | `changed_retrieval_boundary` (`tool_output`) |
| G03 missing right capture | `partial_unknown` |
| G04 sampling differs | `sampling_or_model_changed` |
| G05 incompatible cohort | `incompatible_scope` |
| G06 missing grader provenance | `grader_unproven` |
| G07 declared commitment ≠ measured bytes | `commitment_mismatch` |

This is **not** a proof of stochastic model-output determinism.

## How to run

```bash
pnpm build
pnpm --filter agent-inspect-recipe-comparable-cohort-runs start
```

## Expected output

See `expected-output.txt` (class line).
