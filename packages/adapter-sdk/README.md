# @agent-inspect/adapter-sdk

Author third-party AgentInspect framework adapters with conformance helpers.


**Support level:** Beta — see [SUPPORT-LEVELS.md](https://github.com/rajudandigam/agent-inspect/blob/main/docs/SUPPORT-LEVELS.md).

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

## Minimal third-party adapter example

See [`examples/adapter-sdk/minimal-source-adapter`](../../examples/adapter-sdk/minimal-source-adapter)
for a dependency-free fake framework source that registers adapter metadata,
captures a local metadata-only trace, and runs `runAdapterConformance`.

## Custom renderer example

See [`examples/adapter-sdk/custom-renderer`](../../examples/adapter-sdk/custom-renderer)
for a standalone `TraceRenderer` that renders a metadata-only markdown summary
from a persisted run tree and composes with `renderWithSafety`.

## Privacy

- SDK helpers enforce local-first patterns; adapters must not upload by default
- Use the Adapter SDK privacy checklist to document capture, persistence,
  redaction, and export-review behavior before publishing or proposing registry
  inclusion.

## API

| Export | Purpose |
| ------ | ------- |
| `createAdapterRegistration` | Register adapter metadata |
| `runAdapterConformance` | Conformance test runner |

## Docs

- [Adapter conformance](https://github.com/rajudandigam/agent-inspect/blob/main/docs/ADAPTER-CONFORMANCE.md)
- [Adapter SDK privacy checklist](https://github.com/rajudandigam/agent-inspect/blob/main/docs/ADAPTER-SDK-PRIVACY.md)
- [Adapters](https://github.com/rajudandigam/agent-inspect/blob/main/docs/ADAPTERS.md)
- [Extension submission template](https://github.com/rajudandigam/agent-inspect/blob/main/docs/community/EXTENSION-SUBMISSION-TEMPLATE.md)

## Checklist for package authors

1. Metadata-only default
2. Document peer dependencies
3. No network in adapter code path
4. Add conformance tests
5. Run the privacy checklist and review exported artifacts before sharing
6. Use the extension submission template before proposing registry inclusion


## Version

Part of the fixed AgentInspect release line. See the npm badge / package manifest for the current version.

## License

MIT
