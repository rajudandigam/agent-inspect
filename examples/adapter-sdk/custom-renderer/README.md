# Custom renderer example (adapter SDK)

This example implements the `TraceRenderer` contract from
`@agent-inspect/adapter-sdk` as a standalone markdown summary renderer over a
persisted run tree, with no changes to the core renderer contract.

It demonstrates how a renderer author can:

1. define a renderer with `defineRenderer` (`src/renderer.ts`);
2. keep output metadata-only: names, kinds, statuses, and durations, never
   attribute values or step return values;
3. compose the renderer with `renderWithSafety` for truncation bounds and
   forbidden-string leak checks;
4. render a tree built from locally captured events via
   `persistedInspectEventsToRunTrees`.

## Run it

From the repository root:

```bash
pnpm install
pnpm --filter agent-inspect-example-custom-renderer start
```

The example captures a deterministic local run into
`.agent-inspect-custom-renderer/`, renders it, and prints the markdown followed
by the content type and safety warnings. It exits non-zero if any expected
output marker is missing.

## Expected output markers

```text
# Run summary: custom-renderer-demo
| runId |
## Steps
contentType: text/markdown
```

## Tests

Renderer output shape is covered by
[`packages/adapter-sdk/test/example-custom-renderer.test.ts`](../../../packages/adapter-sdk/test/example-custom-renderer.test.ts):
markers present, `text/markdown` content type, no step return values in the
output, deterministic rendering, and `renderWithSafety` truncation.

## Privacy defaults

- No API keys, no network calls; the traced run is a deterministic fake.
- The renderer never serializes attributes, so prompts and outputs stay out of
  the summary even when the trace contains them.
