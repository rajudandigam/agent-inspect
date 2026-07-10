# @agent-inspect/redact

Deterministic JSON/trace redaction with local, share, and strict profiles.


**Support level:** Stable — see [SUPPORT-LEVELS.md](https://github.com/rajudandigam/agent-inspect/blob/main/docs/SUPPORT-LEVELS.md).

## When to use

- Before attaching traces to issues, Slack, or PRs
- Redacting arbitrary JSON payloads (not only traces)

## When not to use

- Compliance certification (this is a helper, not a compliance engine)
- Automatic upload sanitization pipelines you do not control

## Install

```bash
npm install @agent-inspect/redact
```

## Example

```ts
import { redact } from "@agent-inspect/redact";

const result = redact(
  { apiKey: "demo-token", message: "hello" },
  { profile: "share" },
);
console.log(result.value, result.findings);
```

## Privacy

- Pure local transformation; no network
- Profiles: `local` · `share` · `strict`

## API

| Export | Purpose |
| ------ | ------- |
| `redact` | Redact arbitrary data |
| `createRedactor` | Reusable redactor |
| `RedactionProfile` | Profile type |

## CLI

`npx agent-inspect redact` · `scan` · `verify-safe`

## Docs

- [Safe trace sharing](https://github.com/rajudandigam/agent-inspect/blob/main/docs/SAFE-TRACE-SHARING.md)

## Troubleshooting

- **Still sensitive keys:** Use `strict` profile or custom detectors
- **Large files:** Redact copies; keep originals local


## Version

Part of the fixed AgentInspect release line. See the npm badge / package manifest for the current version.

## License

MIT
