# @agent-inspect/studio

Customer-owned, read-only Studio analyzer for registered AgentInspect workspaces. **No maintainer-hosted cloud.**

**Support level:** Beta — see [SUPPORT-LEVELS.md](https://github.com/rajudandigam/agent-inspect/blob/main/docs/SUPPORT-LEVELS.md).

## When to use

- Team-internal browser UI over one or more local workspaces
- Localhost review of projects, runs, search, and imports
- Explicit, opt-in ingest of files / GitHub artifacts / HTTP (all **disabled by default**)

## When not to use

- Maintainer-hosted dashboards or SaaS
- Production HA / Postgres / enterprise SSO (not supported)
- Trace mutation (Studio is read-only over registered workspaces)

## Install

```bash
npm install agent-inspect @agent-inspect/studio
```

Optional index: `@agent-inspect/index-sqlite` (Beta).

## Two-minute start

```bash
npx agent-inspect studio
# default: http://127.0.0.1:7340
npx agent-inspect studio --port 7340 --host 127.0.0.1
```

Register workspaces via the Studio registry / CLI docs. SQLite is the current supported store.

## Privacy and network

- Binds to **localhost** by default
- **No default upload** or hidden telemetry
- File-drop ingest: local only
- GitHub artifact import: **explicit**; uses your credentials → GitHub
- HTTP ingest: **disabled by default**; requires token + binding when enabled
- See [NETWORK-BEHAVIOR.md](https://github.com/rajudandigam/agent-inspect/blob/main/docs/NETWORK-BEHAVIOR.md) · [SELF-HOSTING.md](https://github.com/rajudandigam/agent-inspect/blob/main/docs/SELF-HOSTING.md)

## Current pages (honest)

Useful HTML for projects, runs, and search. Sessions / suites / safety views may still be thinner than the underlying APIs (JSON-oriented). Treat Studio as Beta.

## API

`createStudioServer`, `startStudioServer` (see package exports).

## CLI

`npx agent-inspect studio` (requires this package installed)

## Limitations

- No Postgres mode
- Not a production APM
- External design-partner evidence still pending for broad adoption claims
- Docker Compose examples are customer-owned templates — verify before production use

## Docs

- [SELF-HOSTING.md](https://github.com/rajudandigam/agent-inspect/blob/main/docs/SELF-HOSTING.md)
- [WORKSPACE.md](https://github.com/rajudandigam/agent-inspect/blob/main/docs/WORKSPACE.md)
- [PRE-V7-PILOT-KIT.md](https://github.com/rajudandigam/agent-inspect/blob/main/docs/PRE-V7-PILOT-KIT.md)

## Version

Part of the fixed AgentInspect release line. See the npm badge / package manifest for the current version.

## License

MIT
