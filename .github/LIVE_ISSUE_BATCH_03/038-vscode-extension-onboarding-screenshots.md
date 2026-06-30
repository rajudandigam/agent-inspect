# VS Code extension onboarding screenshots/GIF

**Labels:** `vscode`, `documentation`, `good first issue`

**Difficulty:** Good first issue

**Milestone:** UI and Performance Polish

## Problem

[docs/SCREENSHOTS.md](../../docs/SCREENSHOTS.md) lacks VS Code trace explorer onboarding assets and capture instructions for the in-repo extension.

## Proposed scope

- Add VS Code section to SCREENSHOTS.md with placeholder paths and capture steps.
- Note read-only / no-upload behavior per [docs/VSCODE.md](../../docs/VSCODE.md).
- Optional: add synthetic screenshot assets if maintainer approves binary commit.

## Out of scope

- Marketplace publish automation.

## Acceptance criteria

- [ ] SCREENSHOTS.md section added
- [ ] Read-only/no-upload note present
- [ ] Docs-only unless assets approved

## Validation commands

```bash
pnpm typecheck
pnpm test
```

## Notes for contributors

Comment before opening a PR. Prefer docs/instructions first; ask before committing large binaries.
