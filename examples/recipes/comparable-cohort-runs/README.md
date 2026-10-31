# Recipe: comparable-cohort-runs

## What this demonstrates

Seven pairs use **thirteen physical stub executions** (one per available side).
Each side measures tool-output and next-model-input bytes from an explicit
synthetic request envelope (ordered messages, system text, tool definitions,
model/sampling, and tool results). Commitments are SHA-256 digests of those
measured bytes. Console lines, the saved table, and the manifest all reference
the same run IDs.

A predefined `StageCommitments` object is not evidence of a second invocation.
An `orderId` tool response cannot substantiate a commitment to policy text that
was never returned. Matching synthetic input commitments do **not** claim
stochastic model-output determinism or answer-quality equivalence.

| Case | Expected class |
| --- | --- |
| G01 same policy bytes enter both model inputs | `equivalent_stage_inputs` |
| G02 policyVersion 1→2 enters next model input | `changed_retrieval_boundary` (`tool_output`) |
| G03 missing right capture | `partial_unknown` |
| G04 sampling differs | `sampling_or_model_changed` |
| G05 incompatible cohort (set before capture) | `incompatible_scope` |
| G06 missing grader provenance | `grader_unproven` |
| G07 declared commitment ≠ measured bytes | `commitment_mismatch` |

`src/verify-saved.ts` / `verify-cli.ts` reopen the retained table and traces in a
separate process. Tamper copies (tool/llm bytes, declared digest, run link,
cohort link, missing right) must fail without mutating the original packet.

## How to run

```bash
pnpm build
pnpm --filter agent-inspect-recipe-comparable-cohort-runs start
```

## Expected output

See `expected-output.txt` (class line plus fresh-process and tamper controls).
