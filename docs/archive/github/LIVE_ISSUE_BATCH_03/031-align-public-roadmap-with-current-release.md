# Align public roadmap with current release

**Labels:** `documentation`, `roadmap`, `maintainer-owned`

**Difficulty:** Maintainer-reviewed docs

**Milestone:** OSS Hygiene

## Problem

`ROADMAP.md` still references **v3.0.0** as current release and **v2.1.0** as active train, while `package.json` is **3.5.3** and v3.1–v3.5 adoption work is shipped. README install section also lags (3.5.2 vs 3.5.3).

## Why it matters

Public roadmap accuracy drives contributor expectations and prevents reopening shipped v1/v2 activation batches.

## Proposed scope

- Update `ROADMAP.md` **Current release** to 3.5.3 and replace stale Now/Next with OSS contribution lanes (docs, examples, fixtures, adapter SDK examples, UI/performance, standards).
- Align README install version line with `package.json` (no version bump in package.json from this issue — docs only).
- Cross-check CHANGELOG top section.
- Keep maintainer release train table but mark v3.0→v3.5 complete.

## Out of scope

- `package.json` version changes, publish, tags, releases.
- Runtime or schema changes.

## Suggested files

- `ROADMAP.md`
- `README.md`
- `CHANGELOG.md` (verify only unless wording fix)

## Acceptance criteria

- [ ] ROADMAP current release matches npm (3.5.3)
- [ ] OSS contribution lanes documented
- [ ] No false "active v2.1 train" framing
- [ ] Maintainer-owned core gap stated (unified persisted run model)

## Validation commands

```bash
pnpm typecheck
pnpm test
```

## Maintainer-owned warning

Release numbering and publish gates remain maintainer-only. Contributors may open a PR but expect maintainer review before merge.
