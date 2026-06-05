# AgentInspect vs production observability comparison

## Problem

`docs/COMPARE.md` covers several tools but could more explicitly address "when to use AgentInspect vs production observability" for professional teams.

## Why it matters

Honest positioning reduces mis-adoption and sets expectations for inner-loop vs production workflows.

## Proposed scope

- Add section to `docs/COMPARE.md` (or companion doc linked from README):
  - Inner loop: local traces, fast iteration, no account
  - Production: sampling, alerting, long-term storage, fleet view
  - Side-by-side table: AgentInspect vs typical production stack
- Cross-link `docs/LIMITATIONS.md`, `docs/KNOWN-ISSUES.md`, `ROADMAP.md`.
- README "What AgentInspect is not" may link to new section.

## Out of scope

- Vendor bashing or inaccurate feature claims.
- Promising future SaaS features.

## Acceptance criteria

- [ ] Clear "not a production observability platform" framing
- [ ] Complement-not-replace language for named platforms
- [ ] No `docs-local` as primary user link

## Suggested files

- `docs/COMPARE.md`
- `README.md`
- `docs/LIMITATIONS.md` (cross-link)

## Tests to add

- None (docs-only).

## Labels

`good first issue`, `documentation`

## Difficulty

**Good first issue**
