# Adapter SDK privacy checklist example

**Labels:** `adapter-sdk`, `security`, `documentation`

**Difficulty:** Good first issue / intermediate

**Milestone:** Adapter SDK Examples

## Problem

Third-party adapters need a documented **privacy checklist** (capture policies, metadata-only defaults, redaction before export) beyond core SECURITY.md.

## Why it matters

Adapter SDK extensions are a common leak surface for prompts/outputs if misconfigured.

## Proposed scope

- Add `docs/ADAPTER-SDK-PRIVACY.md` or `examples/adapter-sdk/privacy-checklist/` with checklist + sample config.
- Link from `packages/adapter-sdk/README.md` and [SAFE-TRACE-SHARING.md](../../docs/SAFE-TRACE-SHARING.md).

## Out of scope

- Changing default redaction internals.

## Suggested files

- `docs/ADAPTER-SDK-PRIVACY.md` or example folder
- `packages/adapter-sdk/README.md`

## Acceptance criteria

- [ ] Checklist covers capture, persist, export review
- [ ] No false "automatic safe to share" claims
- [ ] Docs-only or example-only PR

## Validation commands

```bash
pnpm typecheck
pnpm test
```

## Notes for contributors

Comment before opening a PR.
