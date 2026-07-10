# Custom transform example (adapter SDK)

This example implements the `TraceTransform` contract from
`@agent-inspect/adapter-sdk` to normalize one custom event shape into standard
persisted-event conventions, with no schema changes.

The fake input (`src/events.ts`) looks like what a third-party framework might
persist: generic `LOGIC` events named `fakefw.call` carrying vendor-specific
attributes (`fakefw.op`, `fakefw.channel`, `fakefw.duration_us`). The transform
(`src/transform.ts`) maps them into AgentInspect conventions:

| fakefw convention | Normalized to |
| ----------------- | ------------- |
| `fakefw.channel: "tool"` / `"llm"` | event `kind` `TOOL` / `LLM` |
| `fakefw.op` | `tool:<op>` / `llm:<op>` name plus `toolName` / `operation` attribute |
| `fakefw.duration_us` (microseconds) | `durationMs` |
| `fakefw.model` | `model` attribute |
| unknown channel | event left unchanged plus a `transform.fakefw.unknown-channel` warning |

Events without `fakefw.*` attributes pass through untouched, and the input
array is never mutated.

## Run it

From the repository root:

```bash
pnpm install
pnpm --filter agent-inspect-example-custom-transform start
```

The example runs the transform through `runTransformPipeline`, prints the
normalized events and warnings, runs `runAdapterConformance` over the result,
and exits non-zero if any expected check fails.

## Tests

Conformance-style coverage lives in
[`packages/adapter-sdk/test/example-custom-transform.test.ts`](../../../packages/adapter-sdk/test/example-custom-transform.test.ts):
tool and llm normalization, microsecond to millisecond duration conversion,
unknown-channel warning behavior, input immutability, and composition with
`createKindFilterTransform` plus `runAdapterConformance`.

## Privacy defaults

- Deterministic fake events only; no API keys, no network calls.
- The transform strips vendor keys rather than copying unknown data forward,
  and unknown channels are surfaced as warnings instead of silently guessed.
