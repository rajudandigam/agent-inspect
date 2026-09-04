# Active execution plan — v6.17.7 redaction / DX / evidence

**Train:** `v6.17.7-redaction-dx-evidence`  
**Named:** `agentinspect-feedback-integrity-v6.17.5-to-v6.22`  
**Target:** patch `6.17.7` via Version Packages #326 Trusted Publishing  
**Baseline:** published `6.17.6` + main `0f4ada3` (#323/#324 search fix changeset pending in #326)  
**Authority:** [../ROADMAP.md](../ROADMAP.md) · integrated 6.17.7–6.22 maintainer plan

## Scope

1. P0 high-confidence credential redactor/verifier alignment (`key-value-secret` parity)
2. DX truth — correct `observe()` docs; `check --forbid-tool` alias for `--forbidden-tool`
3. Land Evidence recipe #325 (Maulana authorship); #322 reference-only
4. Publish 6.17.7 through Changesets / `publish.yml` (no local `npm publish`)

## Explicit non-goals / deferrals

- **Remote Studio / website / skill safety** — deferred from this 6.17.7 content (named later train in RELEASE-TRAIN-STATE)
- CLI custom redaction policy (proposal issue only)
- Residual safety CLI surface (proposal issue only)
- `view --errors-only` pruned tree (issue only)
- Guardrail refusal recipe (after design-partner confirm)
- `requiredOrderMode` / #308/#315 (6.20)
- Preview capture / #311 (6.18)
- `alternatives.anyOf` / #309 (6.20)
- Actor scope / outcome provenance #320/#321 (6.21)
- Merging #326 before P0 + DX + #325 land

## Binding refinements

1. High-confidence credentials → safe auto-redact; context-sensitive findings may stay verifier-only
2. No unrestricted CLI regex policy in 6.17.7
3. Refusal evidence starts as recipe/proposal, not new schema/preset
4. Older PRs triaged, not auto-closed; Vercel auth ≠ code failure

## Chunks

| Chunk | Status |
| --- | --- |
| `6.17.7-0-authorize` | in progress |
| `6.17.7-1-p0-key-value-redact` | pending |
| `6.17.7-2-observe-forbid-tool-dx` | pending |
| `6.17.7-3-land-325` | pending |
| `6.17.7-4-publish` | pending |

## Stop rule

Do **not** merge Version Packages #326 or run local `changeset publish` / `npm publish` until chunks 1–3 are on `main` and the full release gate is green.
