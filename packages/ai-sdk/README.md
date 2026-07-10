# @agent-inspect/ai-sdk

Vercel AI SDK telemetry → local AgentInspect traces (metadata-only by default).


**Support level:** Supported — see [SUPPORT-LEVELS.md](https://github.com/rajudandigam/agent-inspect/blob/main/docs/SUPPORT-LEVELS.md).

## When to use

- You use `generateText`, `streamText`, or tool calls via the [AI SDK](https://sdk.vercel.ai/)
- You want framework-native lifecycle mapping without manual `step()` calls

## When not to use

- Non–AI SDK agents (use `observe`, OpenAI Agents, or LangChain adapters)
- Hosted observability replacement

## Install

```bash
npm install agent-inspect @agent-inspect/ai-sdk ai
```

**Peer:** `ai@^6.0.0`

## Example

```ts
import { generateText } from "ai";
import { agentInspect } from "@agent-inspect/ai-sdk";

const integration = agentInspect({ traceDir: ".agent-inspect" });

const result = await generateText({
  model: yourModel,
  prompt: "Hello",
  experimental_telemetry: {
    isEnabled: true,
    recordInputs: false,
    recordOutputs: false,
    functionId: "my-agent",
    metadata: integration.getTelemetryMetadata(),
  },
  ...integration.getTelemetryHandlers(),
});
```

**Required:** `recordInputs: false` and `recordOutputs: false` — AgentInspect does not upload to Vercel; traces stay local.

## Privacy

- Writes JSONL under `.agent-inspect/` only
- No network calls from AgentInspect
- Default capture: metadata-only

## API

| Export | Purpose |
| ------ | ------- |
| `agentInspect(options)` | Telemetry integration factory |
| `getTelemetryHandlers()` | Spread into AI SDK call |
| `getTelemetryMetadata()` | Safe metadata for telemetry block |
| `getDiagnostics()` | Local warnings (e.g. preview mode) |

## CLI

`npx agent-inspect list` · `view` · `report` · `check`

## Docs

- [AI SDK adoption guide](https://github.com/rajudandigam/agent-inspect/blob/main/docs/AI-SDK-ADOPTION.md)
- [Starter](https://github.com/rajudandigam/agent-inspect/tree/main/examples/starters/ai-sdk)
- [Root README](https://github.com/rajudandigam/agent-inspect#readme)

## Troubleshooting

- **No trace events:** Ensure `experimental_telemetry.isEnabled: true` and handlers are spread
- **Preview mode warning:** `capture: "preview"` is not fully implemented; use `metadata-only`


## Version

Part of the fixed AgentInspect release line. See the npm badge / package manifest for the current version.

## License

MIT
