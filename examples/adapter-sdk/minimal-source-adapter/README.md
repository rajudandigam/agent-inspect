# Minimal Adapter SDK source adapter

This example shows the smallest shape of a third-party adapter package that uses
`@agent-inspect/adapter-sdk` without adding a vendor SDK, network access, or
secrets.

It demonstrates how an adapter author can:

1. register adapter metadata with `createAdapterRegistration`;
2. keep the default capture mode metadata-only;
3. capture a deterministic fake framework run with local AgentInspect traces;
4. run `runAdapterConformance` against the captured events.

## Run it

From the repository root:

```bash
pnpm install
pnpm --filter agent-inspect-example-minimal-source-adapter start
```

The example writes a local `.agent-inspect-minimal-adapter/` trace directory and
prints the adapter registration, privacy checklist, and conformance result.

## Privacy defaults

- No API keys or credentials are required.
- No network calls are made by the fake framework source.
- The adapter checklist uses `captureMode: "metadata-only"`.
- The conformance run checks that a forbidden raw string does not appear in the
  persisted events.

Use this as a copy-paste starting point for real adapter packages, then add your
framework-specific event mapping and fixtures.
