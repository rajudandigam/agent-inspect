# Add sensitive-key normalization parity and regression corpus

**Status:** DRAFT — do not open until [#239](https://github.com/rajudandigam/agent-inspect/issues/239) / fix PR is merged  
**Blocked by:** #239  
**Contribution lane:** testing / security  
**Difficulty:** intermediate  
**Ownership:** community-owned  
**Priority:** p2  
**Suggested labels:** `testing`, `security`, `redaction`, `area:core`, `community-owned`, `status:blocked`, `difficulty:intermediate`, `priority:p2`  
**Baseline:** agent-inspect@6.17.3 → 6.18.x (after #239 patch)

## Problem

#239 is the urgent focused fix for camelCase/kebab/dot compound credential keys. After it lands, the repository still needs a **broader permanent regression corpus** so normalization stays consistent across core and `@agent-inspect/redact` without relying on ad-hoc tests alone.

## Why it matters

Duplicate `sensitive-key.ts` copies can drift. A table-driven corpus catches separator-style regressions and false positives (especially token-config keys) before release.

## Proposed scope

- Table-driven tests covering at least:

| Must redact | Must not key-redact |
|-------------|---------------------|
| password, userPassword, user_password, user-password, user.password, USER_PASSWORD | maxTokens |
| clientSecret, client_secret, client-secret | tokenLimit |
| userEmail, sessionCookie | maxOutputTokens |
| accessToken, idToken | emailNote / passwordPolicy (camelCase topic fields) |

- Parity assertions across core and `@agent-inspect/redact` (no new public API)
- Synthetic values only

## Out of scope

- Competing with the #239 PR while it is open
- Public API expansion
- Weaker redaction
- Overly broad substring matching (`*token*` without the existing non-credential allowlist)

## Suggested files

- `packages/core/test/sensitive-key-corpus.test.ts` (or extend existing)
- `packages/redact/test/` parity table
- Keep implementations private and mirrored

## Acceptance criteria

- [ ] Corpus runs in CI
- [ ] Core and redact agree on every row
- [ ] False-positive rows remain false
- [ ] No package boundary / dependency changes

## Privacy / network

Synthetic only. No real secrets. No network.

## Maintainer-review boundary

Tests only after #239 merges. Reject scope that rewrites redaction policy without docs.
