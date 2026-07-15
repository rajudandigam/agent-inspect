# Add OTLP/OpenInference preservation corpus for scope, links, events, and extensions

**Contribution lane:** testing / standards
**Difficulty:** advanced
**Ownership:** community-owned
**Priority:** p1
**Support level:** preview
**Milestone:** Standards Evidence
**Labels:** `testing`, `fixtures`, `area:standards`, `integration:otel`, `integration:openinference`, `community-owned`, `status:ready`, `difficulty:advanced`, `priority:p1`, `support:preview`

## Problem

Basic OTLP/OpenInference fixtures and export goldens exist, but there is no corpus covering resource attributes, instrumentation scope, trace/span IDs, links, events, and unknown extensions with explicit preservation vs intentional loss.

## Why it matters

Standards claims without named losses overstate interoperability.

## Proposed scope

- Add synthetic standards fixtures covering resource attributes, instrumentation scope, trace/span IDs, links, events, and unknown extensions.
- Add round-trip assertions for preserved and intentionally lost fields.
- Do not alter semantic policy without maintainer approval.

## Out of scope

- Certifying vendor compatibility
- Adding root OTel SDK dependency
- Changing exporters without approval

## Suggested files

- `fixtures/standards/`
- Existing standards validators / exporter tests
- `docs/STANDARDS.md` cross-links for known losses

## Acceptance criteria

- [ ] Preservation and loss are explicit
- [ ] Fixtures remain synthetic
- [ ] Tests name known losses
- [ ] No root OTel SDK dependency

## Validation commands

```bash
pnpm fixtures:check
pnpm test
pnpm typecheck
```

## Privacy / network notes

Synthetic fixtures. No external collector required for this issue.

## Contributor instructions

Extend fixtures/standards rather than inventing a parallel folder.

## Maintainer-review boundary

Semantic mapping policy changes need maintainer ack.

