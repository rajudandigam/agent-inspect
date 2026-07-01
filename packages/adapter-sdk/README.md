# @agent-inspect/adapter-sdk

Author third-party AgentInspect framework adapters with conformance helpers.

## When to use

- Building a community or internal adapter package
- Validating metadata-only capture and privacy contracts

## When not to use

- Application tracing (use `agent-inspect` or an existing adapter)

## Install

```bash
npm install @agent-inspect/adapter-sdk agent-inspect
```

## Example

```ts
import { createAdapterRegistration, runAdapterConformance } from "@agent-inspect/adapter-sdk";

export const registration = createAdapterRegistration({
  id: "my-framework",
  // ...
});
```

## Privacy

- SDK helpers enforce local-first patterns; adapters must not upload by default

## API

| Export | Purpose |
| ------ | ------- |
| `createAdapterRegistration` | Register adapter metadata |
| `runAdapterConformance` | Conformance test runner |

## Docs

- [Adapter conformance](https://github.com/rajudandigam/agent-inspect/blob/main/docs/ADAPTER-CONFORMANCE.md)
- [Adapters](https://github.com/rajudandigam/agent-inspect/blob/main/docs/ADAPTERS.md)
- [Extension submission template](https://github.com/rajudandigam/agent-inspect/blob/main/docs/community/EXTENSION-SUBMISSION-TEMPLATE.md)

## Checklist for package authors

1. Metadata-only default
2. Document peer dependencies
3. No network in adapter code path
4. Add conformance tests
5. Use the extension submission template before proposing registry inclusion

## Version

`3.5.x`

## License

MIT
