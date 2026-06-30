# @agent-inspect/eval

Deterministic local eval rules over AgentInspect traces (no LLM judge by default).

## When to use

- CI checks on trace shape, tool usage, completion status
- Custom eval rules alongside `agent-inspect check`

## When not to use

- LLM-as-judge benchmarking platforms
- Hosted eval datasets

## Install

```bash
npm install agent-inspect @agent-inspect/eval
```

## Example

```ts
import { evalRun } from "@agent-inspect/eval";

const result = await evalRun(".agent-inspect/run.jsonl", {
  rules: [/* built-in or custom */],
});
console.log(result.summary);
```

## Privacy

- Reads local files only
- No network

## API

| Export | Purpose |
| ------ | ------- |
| `evalRun` | Run rules on a trace |
| `checks` | Built-in check helpers |

## CLI

`npx agent-inspect eval` · `check`

## Docs

- [CI starter](https://github.com/rajudandigam/agent-inspect/tree/main/examples/starters/ci-eval-redact)

## Troubleshooting

- **AI_EVAL_TRACE_UNREADABLE:** Path or format wrong — use `.jsonl` persisted traces
- **Rule failures:** See `result.findings` for evidence paths

## Version

`agent-inspect@3.5.x`

## License

MIT
