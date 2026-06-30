Thanks for scoping manual AI SDK instrumentation before an official adapter existed.

**Closing as superseded:** v3 ships `@agent-inspect/ai-sdk` plus deterministic recipes:

- `examples/recipes/ai-sdk-local-telemetry/`
- `examples/recipes/ai-sdk-next-route/`
- `examples/starters/ai-sdk/`
- [docs/AI-SDK-ADOPTION.md](../../docs/AI-SDK-ADOPTION.md)

These cover metadata-only local telemetry without the manual-only mock recipe originally proposed.

If you need a **different** AI SDK integration pattern (e.g. custom provider, edge runtime), open a focused follow-up with your stack and expected trace shape.

**Superseded by:** `@agent-inspect/ai-sdk` + recipes/starters above
