# Add clean-room verification of the published npm package

**Status:** DRAFT — optional; coordinate with open packed-consumer work  
**Related open issues:** [#209](https://github.com/rajudandigam/agent-inspect/issues/209), [#213](https://github.com/rajudandigam/agent-inspect/issues/213)  
**Contribution lane:** testing / release  
**Difficulty:** advanced  
**Ownership:** maintainer-owned or community-owned with maintainer review  
**Priority:** p2  
**Suggested labels:** `testing`, `area:release`, `status:ready`, `difficulty:advanced`, `priority:p2`, `support:stable`  
**Baseline:** agent-inspect@latest on npm

## Problem

Local `pnpm pack` / `pack:smoke` verify the tarball built in-repo. They do **not** prove what a real user gets from the **published npm registry**.

## Why it matters

Registry packaging, `files` allow-lists, and Trusted Publishing can diverge from a local pack. Niche-launch partners need periodic clean-room confidence.

## Proposed scope

Periodically verify a clean temporary consumer:

```bash
mkdir temp-project && cd temp-project
pnpm init
pnpm add agent-inspect@latest

npx agent-inspect init --yes
# create synthetic / no-key run
npx agent-inspect list
npx agent-inspect view ...
npx agent-inspect check ...
npx agent-inspect verify-safe ...
npx agent-inspect bundle ...
npx agent-inspect bundle verify ...
```

Prefer:

- `workflow_dispatch` and/or scheduled workflow
- release verification after publish

**Not** a mandatory every-PR network gate.

## Out of scope

- npm publishing from this issue
- Provider/API keys or live LLM calls
- Default telemetry
- Customer traces
- Duplicating all of #209/#213 if those already cover the claimed matrix cells

## Suggested files

- `.github/workflows/npm-clean-room.yml` (dispatch/schedule)
- Short docs note under release / compatibility docs

## Acceptance criteria

- [ ] Clean-room path documented
- [ ] Runs without provider keys
- [ ] Does not block ordinary PRs by default
- [ ] Coordinates with #209 / #213 (references remaining gaps)

## Privacy / network

Network only to the npm registry (and GitHub Actions). Synthetic local traces only. No upload of evidence.

## Maintainer-review boundary

Release/CI hygiene. Reject every-PR mandatory registry installs unless maintainers explicitly approve.
