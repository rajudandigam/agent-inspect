# AgentInspect VS Code extension

Read-only sidebar for local trace directories. The extension shells out to the published `agent-inspect` CLI (`list`, `view`, `timeline`, `report`, `check`, `doctor`, `verify-safe`).

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
