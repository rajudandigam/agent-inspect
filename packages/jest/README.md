# @agent-inspect/jest

Jest reporter for local AgentInspect failure artifacts, plus **experimental** TraceContract matchers.


**Support level:** Supported (reporter) · Experimental (matchers) — see [SUPPORT-LEVELS.md](https://github.com/rajudandigam/agent-inspect/blob/main/docs/SUPPORT-LEVELS.md). Network behavior: [NETWORK-BEHAVIOR.md](https://github.com/rajudandigam/agent-inspect/blob/main/docs/NETWORK-BEHAVIOR.md).

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
const { AgentInspectJestReporter } = require("@agent-inspect/jest");

module.exports = {
  reporters: [
    "default",
    [AgentInspectJestReporter, { artifactDir: ".agent-inspect/jest-artifacts" }],
  ],
};
```

## Trace association

This reporter **does not** instrument Jest or invent associations from timestamps.
Failed tests without an association produce one `no-trace-association` diagnostic
(and a bounded `no-trace-association.md` note) instead of a silent no-op.

Associate a test to a local trace with one of:

```js
const { withAgentInspectJestTrace } = require("@agent-inspect/jest");

// 1) Helper metadata on the assertion result
expect.extend({
  /* your matcher can attach: */
  ...withAgentInspectJestTrace({
    runId: "run_abc",
    tracePath: ".agent-inspect/run_abc.jsonl",
  }),
});

// 2) Reporter options
[
  AgentInspectJestReporter,
  {
    associations: {
      "agent.test.js::does the thing": {
        runId: "run_abc",
        tracePath: ".agent-inspect/run_abc.jsonl",
      },
    },
    // or resolveTrace: (test) => ({ runId, tracePath })
  },
];
```

## Privacy

- Local files on failure; no network from AgentInspect

## API

- `createAgentInspectJestReporter` / `AgentInspectJestReporter`
- `withAgentInspectJestTrace` — explicit association helper (no automatic capture)
- `agentInspectJestMatchers` — Experimental (`toPassTraceContract`, `toHaveRequiredTool`)

## CLI

`npx agent-inspect report` on uploaded CI artifacts

## Limitations

- Primary surface is a **reporter** (failure artifacts) plus **experimental** matchers.
- Experimental matchers:

```js
const { expect } = require("@jest/globals");
const { agentInspectJestMatchers } = require("@agent-inspect/jest");

expect.extend(agentInspectJestMatchers);

expect(read).toPassTraceContract(contract);
expect(read).toHaveRequiredTool("lookup_orders");
```

- There is no `expectTrace(...).toSatisfyTraceContract` helper.
- Use `agent-inspect check` / TraceContract APIs for deep CI gates when matchers are insufficient.

## Docs

- [CI artifacts](https://github.com/rajudandigam/agent-inspect/blob/main/docs/CI-ARTIFACTS.md)
- [TRACE-CONTRACTS.md](https://github.com/rajudandigam/agent-inspect/blob/main/docs/TRACE-CONTRACTS.md)

## Troubleshooting

- **Reporter not loaded:** Check Jest `reporters` array syntax for your Jest version


## Version

Part of the fixed AgentInspect release line. See the npm badge / package manifest for the current version.

## License

MIT
