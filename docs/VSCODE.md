# AgentInspect VS Code extension

Read-only sidebar for local trace directories. The extension shells out to the published `agent-inspect` CLI (`list`, `view`, `timeline`, `report`, `check`, `doctor`, `verify-safe`).

**Support level:** Experimental (unpublished). Ignored by Changesets; not part of the fixed npm release group.

## Product scope decision (6.18.0-H)

**Disposition: defer (Option A).** Keep the in-repo extension unpublished. Core, official adapters, CLI, and Evidence take precedence over Marketplace packaging. Open PR #295 (sample trace command) and related issues (#66, #65) stay out of the active 6.18 implementation train until a later capacity window revisits VS Code.

Do not merge #295 merely to clear the contributor queue.

## Develop

```bash
pnpm install
pnpm --filter agent-inspect-vscode run build
```

Open `packages/vscode` in VS Code and press F5 (Extension Development Host).

## Requirements

- Node 20+
- `agent-inspect` available via `npx` in the workspace (devDependency or global)

## Manual gate

First VS Code Marketplace publish requires maintainer credentials. See [VSCODE-EXTENSION-RFC.md](./proposals/VSCODE-EXTENSION-RFC.md).
