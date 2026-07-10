# @agent-inspect/viewer

Localhost-only read-only trace viewer (not a hosted dashboard).


**Support level:** Beta — see [SUPPORT-LEVELS.md](https://github.com/rajudandigam/agent-inspect/blob/main/docs/SUPPORT-LEVELS.md).

## When to use

- Quick browser UI for a trace directory on your machine

## When not to use

- Team-wide hosted dashboards
- Production monitoring

## Install

```bash
npm install @agent-inspect/viewer
```

## Example

```bash
npx agent-inspect view <run-id> --serve
# or use viewer package API to start local server
```

## Privacy

- Binds to localhost; reads local files only
- No default upload to AgentInspect

## API

Viewer server factory (see package exports).

## CLI

`npx agent-inspect view --serve`

## Docs

- [SCREENSHOTS](https://github.com/rajudandigam/agent-inspect/blob/main/docs/SCREENSHOTS.md)

## Troubleshooting

- **Port in use:** Pass alternate port if supported by CLI flags


## Version

Part of the fixed AgentInspect release line. See the npm badge / package manifest for the current version.

## License

MIT
