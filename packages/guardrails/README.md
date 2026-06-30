# @agent-inspect/guardrails

Deterministic local guardrail rules over traces and metadata.

## When to use

- Pre-share checks (tool allowlists, metadata bounds)
- Custom deterministic policies in CI

## When not to use

- Remote policy engines or compliance certification
- Default enforcement (opt-in only)

## Install

```bash
npm install @agent-inspect/guardrails
```

## Example

```ts
import { runGuardrails } from "@agent-inspect/guardrails";

const result = runGuardrails(traceEvents, { rules: [/* ... */] });
```

## Privacy

- Local evaluation only; no network

## API

Guardrail rule runners and built-in rule types (see package exports).

## CLI

Combine with `npx agent-inspect check`

## Docs

- [Safe trace sharing](https://github.com/rajudandigam/agent-inspect/blob/main/docs/SAFE-TRACE-SHARING.md)

## Troubleshooting

- Rules are deterministic — they do not call LLMs

## Version

`3.5.x`

## License

MIT
