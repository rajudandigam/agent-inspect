# Recipe: nestjs-tenant-incident (Uduak / W14)

Real NestJS `TestingModule` bootstrap. `SupportService.retrievePolicy` /
`answerWithPolicy` run on the Nest DI path (not a duplicated answer in the
harness). Keyless stubbed policy store.

One supported causal claim: the answer must **consume** the Nest-retrieved
policy object for the **requested** tenant. Final case verdicts reopen saved
JSONL via `verify-saved` — they do not trust in-memory `joinOk` or expected
labels. Structural `TraceContract` (tool presence + order) is reported
separately and is **not** a tenant-consumption oracle.

Captured identifiers use recipe-scoped **opaque** operation / tenant / result
refs (`op-ref-*`, `tref-alpha`, `tref-beta`, `rref-*`). Under `share`/`strict`,
`[REDACTED] == [REDACTED]` is **unknown**, not a join match. `SAFE` is not a
general privacy certificate.

| Variant | Expectation |
| --- | --- |
| N01 good (opaque alpha → policy alpha) | contract pass + consumption pass |
| N02 wrong bind (alpha request, beta policy) | consumption fail (structure may still pass) |
| N03 absent retrieve | consumption fail |
| N03b stale/future resultRef at answer | consumption fail |
| N04 overlapping tenants | isolated consumption per run |
| N05 app error | original Nest-path error preserved |
| N07 privacy local/share/strict | no legacy tokens; cases distinguishable or unknown |
| N08 tampered saved relation | fresh-process verifier fails |

Synthetic opaque refs only. No private partner data.

## Exact command

```bash
AGENT_INSPECT_SILENT=true pnpm --filter agent-inspect-recipe-nestjs-tenant-incident start
```

Fresh-process re-score of a retained capture:

```bash
pnpm --filter agent-inspect-recipe-nestjs-tenant-incident verify-saved -- .agent-inspect-runs/N01-good-tenant-a
```

## Narrow handback

- Supported: requested-tenant policy consumption on the Nest path from reopened
  outcomes (declared context, retrieval commitment, answer-boundary consumption).
- Not claimed: production Nest multi-tenancy, partner data, or that four
  structural contract rules imply semantic tenant safety.
- Evidence: recipe stdout matrix + `.agent-inspect-runs/` traces from the
  command above.
