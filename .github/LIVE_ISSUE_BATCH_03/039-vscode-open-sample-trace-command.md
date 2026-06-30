# VS Code: open sample trace command

**Labels:** `vscode`, `enhancement`, `help wanted`

**Difficulty:** Intermediate

**Milestone:** UI and Performance Polish

## Problem

VS Code extension lacks a demo-friendly command to open a **bundled or fixture trace directory** read-only for onboarding.

## Proposed scope

- Add command (e.g. "AgentInspect: Open Sample Trace") opening a repo fixture or bundled sample under `packages/vscode/`.
- Read-only; no network; uses existing CLI/read path where possible.

## Out of scope

- Marketplace listing.
- Upload or cloud sync.

## Suggested files

- `packages/vscode/` (extension code — scoped PR required)

## Acceptance criteria

- [ ] Command opens sample trace in explorer
- [ ] No network calls
- [ ] Tests or manual test steps documented

## Validation commands

```bash
pnpm typecheck
pnpm test
pnpm build
```

## Maintainer-owned warning

VS Code extension internals may need maintainer ack for command surface changes. Comment before coding.
