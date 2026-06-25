# AI SDK integration proposal

**Status:** planning for v1.7.0 after v1.6 runtime/read/write foundation.
**Purpose:** implementation-ready replacement for the earlier issue-only AI SDK adapter plan.

## Goal

Provide an optional `@agent-inspect/ai-sdk` package that maps Vercel AI SDK telemetry/lifecycle data into local AgentInspect traces without monkey-patching providers, global fetch, or core SDK functions.

## Intended usage

```ts
import { agentInspect } from "@agent-inspect/ai-sdk";

const result = await streamText({
  model,
  prompt,
  experimental_telemetry: {
    isEnabled: true,
    recordInputs: false,
    recordOutputs: false,
    integrations: [
      agentInspect({
        traceDir: ".agent-inspect",
        capture: "metadata-only",
      }),
    ],
  },
});
```

## Capture policy

```ts
type CaptureMode = "metadata-only" | "preview" | "full";
```

Defaults:

- `metadata-only`;
- `recordInputs: false`;
- `recordOutputs: false`;
- no tool arguments/results persisted by default;
- no per-token JSONL events.

Preview mode must be explicit, bounded, and redacted.

## Mapping

| AI SDK signal | AgentInspect kind |
| --- | --- |
| generation / model call | `LLM` |
| tool call | `TOOL` |
| multi-step operation | `CHAIN` or `AGENT` depending on SDK context |
| final result | `RESULT` |
| failure | error status plus structured error |

Capture when available:

- model ID and provider;
- step number;
- finish reason;
- response ID;
- duration;
- token usage;
- retries;
- streaming start/finish timing;
- first-chunk latency;
- chunk count when reliable.

## Package boundary

- optional package;
- peer dependency on supported AI SDK versions;
- no AI SDK dependency in root `agent-inspect`;
- own compatibility matrix and fixtures;
- experimental adapter API during v1.x.

## Validation expectations

- generateText fixture;
- streamText fixture;
- tool call fixture;
- failed provider/tool fixture;
- metadata-only privacy tests;
- preview bounds/redaction tests;
- token usage preservation tests;
- ESM/CJS package smoke where applicable.

## Release dependency

Do not implement this package before v1.6 publishes and verifies the runtime, writer, and reader foundation.
