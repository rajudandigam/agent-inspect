# Add clean install smoke-test guide

**Labels:** `documentation`, `testing`, `package-compatibility`

**Difficulty:** Good first issue

## Problem

Users and maintainers need a simple guide to verify a clean install — npm/pnpm install, ESM import, CJS require, and CLI help — without reading the full monorepo development docs.

## Why it matters

Post-release validation and contributor onboarding both benefit from a reproducible smoke-test checklist in a temp directory. This supports the local-first, CLI-first story without changing package exports.

## Proposed scope

- Add `docs/INSTALL-SMOKE-TEST.md`.
- Include steps for npm, pnpm, and `npx agent-inspect --help`.
- Include minimal ESM import and CJS require examples in a temp project.
- Document Node.js / TypeScript version notes (align with repo engines).
- Include a **troubleshooting** section (wrong Node version, module resolution, missing build artifacts when testing from clone).
- Include **what to report** when something fails (versions, command output, OS).

## Out of scope

- No package export or `package.json` export map changes.
- No runtime code changes in `packages/`.
- No automated CI workflow changes (see batch 02 issue 007 for CI artifact example).

## Suggested files

- `docs/INSTALL-SMOKE-TEST.md` (new)
- Link from [README.md](../../README.md) Development or Contributing section
- Optional cross-link from [CONTRIBUTING.md](../../CONTRIBUTING.md)

## Acceptance criteria

- [ ] Guide can be followed in a clean temp folder
- [ ] Includes Node/TypeScript version notes
- [ ] Includes troubleshooting section
- [ ] Includes failure reporting template

## Validation commands

```bash
pnpm typecheck
pnpm test
```

Optional manual verification in `/tmp`:

```bash
mkdir /tmp/agent-inspect-smoke && cd /tmp/agent-inspect-smoke
npm init -y
npm install agent-inspect
npx agent-inspect --help
```

## Notes for contributors

- Comment on this issue before opening a PR.
- Follow commands exactly; do not claim guarantees beyond what npm install provides.
- Reference existing `scripts/package-smoke.mjs` for maintainer tarball checks — do not duplicate maintainer-only steps unless clearly labeled.

## Maintainer note

Keep package export compatibility tests maintainer-owned; this doc is user/contributor facing only.
