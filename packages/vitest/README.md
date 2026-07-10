# @agent-inspect/vitest

Vitest reporter — failed tests emit local trace artifacts; passing tests stay quiet.


**Support level:** Supported — see [SUPPORT-LEVELS.md](https://github.com/rajudandigam/agent-inspect/blob/main/docs/SUPPORT-LEVELS.md).

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
- No default upload to AgentInspect

## API

Default export: Vitest reporter factory.

## CLI

After failure: `npx agent-inspect report <run-id>`

## Limitations

- This package is a **reporter** (failure artifacts). It does **not** ship Vitest TraceContract matchers such as `expectTrace(...).toSatisfyTraceContract`.
- Use `agent-inspect check` / TraceContract APIs for trajectory assertions.

## Docs

- [CI artifacts](https://github.com/rajudandigam/agent-inspect/blob/main/docs/CI-ARTIFACTS.md)
- [TRACE-CONTRACTS.md](https://github.com/rajudandigam/agent-inspect/blob/main/docs/TRACE-CONTRACTS.md)

## Troubleshooting

- **No artifact:** Ensure trace was written during test and reporter `traceDir` matches
- **Original errors preserved:** Reporter does not swallow Vitest failures


## Version

Part of the fixed AgentInspect release line. See the npm badge / package manifest for the current version.

## License

MIT
