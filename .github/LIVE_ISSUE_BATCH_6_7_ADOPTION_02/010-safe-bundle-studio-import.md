# Add share-safe bundle → local Studio import walkthrough

**Contribution lane:** docs / examples / studio
**Difficulty:** intermediate
**Ownership:** community-owned
**Priority:** p2
**Support level:** beta
**Milestone:** Golden Path & Examples
**Labels:** `documentation`, `examples`, `area:studio`, `community-owned`, `status:ready`, `difficulty:intermediate`, `priority:p2`, `support:beta`

## Problem

Shareable bundle recipes exist, but pilots lack a tested walkthrough from capture → redact → verify-safe → bundle --profile share → import into customer-owned local Studio.

## Why it matters

Studio is customer-owned and local; missing the import step leaves adoption evidence incomplete.

## Proposed scope

- Document and test a synthetic local workflow:
  capture → redact → verify-safe → bundle --profile share → import into local Studio → inspect.
- Reuse current Studio and bundle commands.

## Out of scope

- Hosted service
- Auth changes
- Ingestion architecture changes
- Real production data

## Suggested files

- `examples/recipes/shareable-bundle-basic/`
- `packages/studio/` docs / README
- `docs/SAFE-TRACE-SHARING.md`
- `docs/GOLDEN-PATH.md`
- `docs/NETWORK-BEHAVIOR.md` (link)

## Acceptance criteria

- [ ] Local-only path works
- [ ] Safety review precedes import
- [ ] Studio remains customer-owned (no maintainer cloud)
- [ ] Commands match current CLI

## Validation commands

```bash
pnpm recipes:check
pnpm docs:check
pnpm typecheck
```

## Privacy / network notes

Keep Studio HTTP ingest disabled by default. No default upload.

## Contributor instructions

Reuse shareable-bundle-basic. Do not invent a second bundle pipeline.

## Maintainer-review boundary

Auth / ingest defaults are maintainer-owned.

