# Custom TraceReader authoring

AgentInspect already exposes an experimental `TraceReader` interface on `agent-inspect/readers`. Use it to normalize **foreign persisted session JSON** into `PersistedInspectEvent` rows, then consume those rows with `buildTraceFacts`, TraceContract, Evidence, and the read-only MCP tools.

There is **no** dynamic plugin loader, **no** network fetch inside readers, and **no** official vendor package for third-party session APIs.

```text
foreign persisted data
→ custom TraceReader
→ normalized PersistedInspectEvent / TraceReadResult
→ logical projection
→ TraceFacts / checks / report / Evidence
```

## Contract

Implement `TraceReader`:

| Member | Requirement |
| --- | --- |
| `format` | Stable format id (for example `synthetic-session-json`) |
| `name?` | Human-readable reader name |
| `detect(input)` | Deterministic, local, non-throwing preference: return a candidate or `undefined` |
| `read(input)` | Return `TraceReadResult` or throw `TraceReadError` |

Register the reader only for the call that needs it:

```ts
import { openTrace, type TraceReader } from "agent-inspect/readers";
import { buildTraceFacts } from "agent-inspect/checks";

const read = await openTrace(
  { type: "file", path: "./session.json" },
  { readers: [myReader, ...DEFAULT_TRACE_READERS] },
);
// or force a format:
// { format: "synthetic-session-json", readers: [myReader] }

const facts = buildTraceFacts(read);
```

## Required behaviors

- **Explicit format override** skips detection and selects the registered reader for that `format`.
- **Ambiguous detection** (two high-confidence candidates within the built-in delta) fails with `TraceReadError` code `ambiguous_format`.
- **Unsupported input** fails with `unsupported_format` rather than inventing a tree.
- Emit **warnings** and **unsupportedFields** for skipped or lossy fields; do not silently claim full fidelity.
- Preserve **source**, **confidence**, parent / correlation ids, and event order for accepted rows.
- Bound values; never fetch URLs or execute code from a trace file.
- Foreign timestamps are scheduling hints only — they do **not** prove causality.
- Every emitted event must pass `isPersistedInspectEvent`.

## Duplicate and unsupported events

Document a deterministic rule and stick to it. The synthetic recipe uses:

- **duplicate event ids** → hard failure (`invalid_input` / reader error)
- **unsupported event types** → warning + `unsupportedFields` entry; event omitted

## Recipe

See [external-persisted-session-reader](../examples/recipes/external-persisted-session-reader/) for a generic, vendor-neutral fixture and conformance-oriented reader.

Related: [API.md](./API.md) § readers · [CHOOSE-YOUR-CAPTURE-PATH.md](./CHOOSE-YOUR-CAPTURE-PATH.md) · [TRACE-FACTS.md](./TRACE-FACTS.md)
