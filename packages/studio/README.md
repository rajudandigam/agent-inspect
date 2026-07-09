# @agent-inspect/studio

Self-hosted, read-only Studio analyzer for multi-project AgentInspect workspaces. Customer-owned — no maintainer cloud.

## When to use

- Team-internal browser UI over multiple AgentInspect workspaces
- Localhost or explicitly configured self-hosted binding

## When not to use

- Maintainer-hosted dashboards or SaaS
- Trace mutation or ingest (use CLI writers; ingest is v6.1+)

## Install

```bash
npm install agent-inspect @agent-inspect/studio
```

## Example

```bash
npx agent-inspect studio
npx agent-inspect studio --port 7340 --host 127.0.0.1
```

## Privacy

- Binds to localhost by default; read-only GET routes
- No default upload or telemetry

## API

`createStudioServer`, `startStudioServer` (see package exports).

## CLI

`npx agent-inspect studio` (requires this package installed)

## Docs

- [SELF-HOSTED-STUDIO-V6.0.md](../../docs/proposals/SELF-HOSTED-STUDIO-V6.0.md)

## License

MIT
