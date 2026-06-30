# agent-inspect-vscode

VS Code extension for browsing local AgentInspect traces (in-repo; **not published to Marketplace yet**).

## When to use

- You live in VS Code and want a trace explorer sidebar
- CLI-backed commands (`list`, `doctor`) from the editor

## When not to use

- Marketplace install (not available yet — use F5 dev host)
- Hosted trace UI

## Develop locally

1. Open `packages/vscode` in VS Code
2. Run **Extension Development Host** (F5)
3. Open a workspace with `.agent-inspect/`

## Privacy

- Read-only local file access
- No upload

## Docs

- [VSCODE.md](https://github.com/rajudandigam/agent-inspect/blob/main/docs/VSCODE.md)
- [RFC](https://github.com/rajudandigam/agent-inspect/blob/main/docs/proposals/VSCODE-EXTENSION-RFC.md)

## License

MIT
