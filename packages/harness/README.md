# @agent-inspect/harness

Fixture runner for tracing real projects locally (bootstrap → invoke → shutdown).


**Support level:** Supported — see [SUPPORT-LEVELS.md](https://github.com/rajudandigam/agent-inspect/blob/main/docs/SUPPORT-LEVELS.md).

## When to use

- You have a real app (NestJS, Express, etc.) and want deterministic fixture runs
- CI or local recipes with stdin JSON fixtures

## When not to use

- Simple scripts (use `observe` or `inspectRun`)
- Hosted test runners

## Install

```bash
npm install agent-inspect @agent-inspect/harness
```

## Example

```ts
import { createFixtureRunner, defineTarget } from "@agent-inspect/harness";

const runner = createFixtureRunner({
  name: "my-app",
  bootstrap: async () => app,
  shutdown: async (app) => app.close(),
});

runner.register(
  defineTarget({
    name: "chat",
    resolve: (app) => app.get(ChatService),
    invoke: async (target, input) => target.run(input),
  }),
);

await runner.runTarget("chat", { fixturePath: "fixtures/hello.json" });
```

## Privacy

- Traces written locally via `agent-inspect`
- No default upload to AgentInspect

## API

| Export | Purpose |
| ------ | ------- |
| `createFixtureRunner` | Runner with bootstrap/shutdown |
| `defineTarget` | Register callable targets |
| CLI via `agent-inspect harness` | Run fixtures from shell |

## CLI

`npx agent-inspect harness run` · `list-targets`

## Docs

- [NestJS harness starter](https://github.com/rajudandigam/agent-inspect/tree/main/examples/starters/harness-nestjs)
- [NESTJS.md](https://github.com/rajudandigam/agent-inspect/blob/main/docs/NESTJS.md)

## Troubleshooting

- **bootstrap_failed:** Check app module imports and env vars (use fixtures, not prod secrets)
- **fixture_read_failed:** Validate JSON fixture path


## Version

Part of the fixed AgentInspect release line. See the npm badge / package manifest for the current version.

## License

MIT
