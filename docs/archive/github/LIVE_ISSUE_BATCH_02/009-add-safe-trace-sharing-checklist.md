# Add safe trace sharing checklist

**Labels:** `good first issue`, `documentation`, `security`

**Difficulty:** Good first issue

## Problem

Users share trace files in GitHub issues, Discussions, PRs, and internal threads without a simple checklist for redaction and metadata review. [SECURITY.md](../../SECURITY.md) covers policy but not a step-by-step sharing workflow.

## Why it matters

AgentInspect defaults help (metadata redaction, size bounds), but they are not a guarantee for all fields or exported artifacts. A practical checklist reduces accidental secret leakage.

## Proposed scope

- Add `docs/SAFE-TRACE-SHARING.md` with a checklist covering:
  - Prefer redacted output / review `redact: false` traces carefully
  - Inspect manual metadata and log-derived fields
  - Avoid raw prompts/outputs in public threads unless explicitly approved
  - Remove emails, tokens, API keys, customer IDs
  - Prefer Markdown export for sharing when appropriate
- Link from [SECURITY.md](../../SECURITY.md) and [README.md](../../README.md) Contributing/Security sections.

## Out of scope

- No changes to redaction implementation or security internals.
- No new default redaction keys without maintainer security review.
- No fake guarantees (“100% safe to share”).

## Suggested files

- `docs/SAFE-TRACE-SHARING.md` (new)
- `SECURITY.md` (add link)
- `README.md` (add link in security/contributing area)

## Acceptance criteria

- [ ] Checklist is practical and actionable
- [ ] Links from security docs and README
- [ ] No overclaiming automatic redaction coverage
- [ ] Mentions exports and log ingest configs, not just JSONL traces

## Validation commands

```bash
pnpm typecheck
pnpm test
```

## Notes for contributors

- Comment on this issue before opening a PR.
- Align with [SECURITY.md](../../SECURITY.md) — docs-only clarification, not policy change without maintainer ack.

## Maintainer note

Redaction internals remain maintainer-owned; this issue is contributor-facing guidance only.
