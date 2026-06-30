# @agent-inspect/vitest

Vitest reporter — failed tests emit local trace artifacts; passing tests stay quiet.

## When to use

- Vitest suites that run instrumented agents
- You want PR artifacts on failure without changing test assertions

## When not to use

- Jest (use `@agent-inspect/jest`)
- Tests without AgentInspect traces

## Install

```bash
npm install agent-inspect @agent-inspect/vitest vitest
```

**Peer:** `vitest@^2.1.0`

## Example

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
import agentInspectReporter from "@agent-inspect/vitest";

export default defineConfig({
  test: {
    reporters: ["default", agentInspectReporter({ traceDir: ".agent-inspect" })],
  },
});
```

## Privacy

- Writes traces locally on failure only (by default)
- No upload

## API

Default export: Vitest reporter factory.

## CLI

After failure: `npx agent-inspect report <run-id>`

## Docs

- [CI artifacts](https://github.com/rajudandigam/agent-inspect/blob/main/docs/CI-ARTIFACTS.md)

## Troubleshooting

- **No artifact:** Ensure trace was written during test and reporter `traceDir` matches
- **Original errors preserved:** Reporter does not swallow Vitest failures

## Version

`agent-inspect@3.5.x` · Vitest `^2.1.0`

## License

MIT
