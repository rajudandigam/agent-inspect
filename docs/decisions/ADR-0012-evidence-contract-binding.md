# ADR-0012 — Evidence contract binding (6.28)

## Status

Accepted

## Context

Evidence v2 already hashes packaged files and records optional `semantics.contractStatus`. Reviewers can verify integrity but cannot always reconstruct **which** TraceContract or check preset was evaluated (aliases, defaults, presets, scope, ordering modes, control/retry rules). Programmatic `TraceCheckRule.evaluate` functions cannot be made reviewer-reproducible via JSON alone.

## Decision

1. **Additive binding** — optional `contract` on `evidence.json` (`EvidenceContractBinding`) plus optional packaged `contract.resolved.json`. Evidence format version stays `"1.0"`; older readers ignore unknown fields.

2. **Canonicalization version `"1"`** — normalize TraceContract aliases (`requiredTools` → `required`, …), expand presets/CLI shorthand into a serializable snapshot, make relevant evaluator defaults explicit, sort keys, serialize deterministically, digest with SHA-256.

3. **Status honesty** — `complete` only for fully serializable declarative contracts; `partial` when custom/programmatic rules are present (record `unsupportedRuleIds`, never hash function source as proof); `unavailable` when no contract was packaged.

4. **Check-result binding** — `check-results.json` may carry `contractDigest`, `canonicalizationVersion`, `engineVersion`, and evaluated rule IDs. `bundle verify` checks file presence, manifest hash, and digest agreement when binding is present. It does **not** re-run contracts by default.

5. **Assurance boundaries** — binding does not claim producer identity, trusted time, source completeness, semantic truth, or external acceptance. No signing or key management in this train.

## Consequences

- Share/strict Evidence that includes a resolved contract must still pass the existing safety gate; sensitive expected values remain a safety concern.
- Custom rules keep working but Evidence correctly marks reproducibility as partial.
- See `docs/EVIDENCE-FORMAT.md` and `docs/SAFE-TRACE-SHARING.md`.
