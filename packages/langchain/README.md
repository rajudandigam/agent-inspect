# @agent-inspect/langchain

LangChain callback handler → local AgentInspect traces.


**Support level:** Supported — see [SUPPORT-LEVELS.md](https://github.com/rajudandigam/agent-inspect/blob/main/docs/SUPPORT-LEVELS.md).

## When to use

- LangChain or LangGraph apps using `@langchain/core` callbacks
- You want `persist: true` local JSONL without a hosted backend

## When not to use

- Raw LangGraph without LangChain callbacks (wire callbacks at integration points)
- Hosted LangSmith as replacement

## Install

```bash
npm install agent-inspect @agent-inspect/langchain @langchain/core
```

**Peer:** `@langchain/core@^1.0.0`

## Example

```ts
import { AgentInspectCallback } from "@agent-inspect/langchain";

const handler = new AgentInspectCallback({
  traceDir: ".agent-inspect",
  runName: "my-chain",
  persist: true,
});

// Pass handler to your chain / runnable callbacks
```

## Privacy

- Local files only; metadata-only default
- No AgentInspect network activity

## API

| Export | Purpose |
| ------ | ------- |
| `AgentInspectCallback` | LangChain `BaseCallbackHandler` |
| `extractModelName`, `safePreview` | Metadata helpers |

## CLI

With `persist: true`, use the same directory configured in `traceDir`:

```bash
npx agent-inspect list --dir ./.agent-inspect
npx agent-inspect view <run-id> --dir ./.agent-inspect --summary
npx agent-inspect report <run-id> --dir ./.agent-inspect
```

Persisted traces remain local. Before sharing an export or report, follow the
[safe trace sharing checklist](https://github.com/rajudandigam/agent-inspect/blob/main/docs/SAFE-TRACE-SHARING.md)
and review the generated artifact for sensitive metadata.

## Docs

- [Adapters](https://github.com/rajudandigam/agent-inspect/blob/main/docs/ADAPTERS.md)
- [Starter](https://github.com/rajudandigam/agent-inspect/tree/main/examples/starters/langchain)

## Troubleshooting

- **Empty trace:** Set `persist: true` and ensure callbacks are attached to the runnable
- **LangGraph:** Route through LangChain callback surfaces where possible


## Version

Part of the fixed AgentInspect release line. See the npm badge / package manifest for the current version.

## License

MIT
