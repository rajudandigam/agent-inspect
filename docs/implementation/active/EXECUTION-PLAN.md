# Active execution plan — next releases (6.17.8 → 6.19.0)

**Train:** `v6.17.8-closeout-trust`  
**Named:** `agentinspect-feedback-integrity-v6.17.5-to-v6.22`  
**Target:** patch `6.17.8`, then minors `6.18.0` and `6.19.0` via Changesets Trusted Publishing  
**Baseline:** published `6.17.7` + main after contributor batch `#338`  
**Authority:** [../ROADMAP.md](../ROADMAP.md) · [NEXT-RELEASES.md](./NEXT-RELEASES.md)

## Scope

1. Closeout 6.17.8: `#340` clean `--keep`; MCP untrusted-trace boundary; tracker truth
2. Publish 6.17.8 (Trusted Publishing only)
3. Implement and publish 6.18.0 and 6.19.0 per NEXT-RELEASES chunks
4. Roadmap/label hygiene for 6.20–6.22 only (no implementation in this train)

## Explicit non-goals / deferrals

- Email-send / outreach gates (removed from repo state)
- `6.17.7b` / vague Studio deferral naming (retired; optional-surface assessment in 6.17.8 closeout)
- `6.17.9` unless a verified post-ship security/compat defect appears
- Implementing 6.20–6.22 content in this run
- Local `npm publish`; Mastra-from-interest; schema 1.1; full-content capture; ADPA `#142` before external gate

## Chunks

See [NEXT-RELEASES.md](./NEXT-RELEASES.md). Historical 6.17.7 chunks are complete (Version Packages `#326`; npm `6.17.7`).

## Stop rule

Trusted Publish each train when Changesets/npm/tags agree. Continue through 6.19.0. Stop only on CI/publication gates or material plan conflict.
