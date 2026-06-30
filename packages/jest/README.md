# @agent-inspect/jest

Jest reporter — local trace artifacts on failed tests.

## When to use

- Jest test suites with AgentInspect-instrumented agents
- CI failure evidence alongside native Jest output

## When not to use

- Vitest (use `@agent-inspect/vitest`)

## Install

```bash
npm install agent-inspect @agent-inspect/jest jest
```

**Peer:** `jest@^29.0.0 || ^30.0.0` (optional meta)

## Example

```js
// jest.config.js
module.exports = {
  reporters: [
    "default",
    ["@agent-inspect/jest", { traceDir: ".agent-inspect" }],
  ],
};
```

## Privacy

- Local files on failure; no network from AgentInspect

## API

Jest reporter class / factory (see package types).

## CLI

`npx agent-inspect report` on uploaded CI artifacts

## Docs

- [CI artifacts](https://github.com/rajudandigam/agent-inspect/blob/main/docs/CI-ARTIFACTS.md)

## Troubleshooting

- **Reporter not loaded:** Check Jest `reporters` array syntax for your Jest version

## Version

`agent-inspect@3.5.x`

## License

MIT
