Thanks for the Vercel AI SDK adapter design note — it informed the v1.7+ / v3 adapter train.

**Closing as superseded:** Public package `@agent-inspect/ai-sdk` is published with conformance tests, metadata-only defaults, and adoption docs:

- [packages/ai-sdk/README.md](../../packages/ai-sdk/README.md)
- [docs/AI-SDK-ADOPTION.md](../../docs/AI-SDK-ADOPTION.md)
- Recipes under `examples/recipes/ai-sdk-*`

Official adapter internals and export policy remain maintainer-owned; third-party extensions should use `@agent-inspect/adapter-sdk` (see batch 03 issue drafts).

If a **design gap** remains in the official adapter, open a focused bug or RFC with repro and version — not a duplicate design-note issue.

**Superseded by:** shipped `@agent-inspect/ai-sdk` package
