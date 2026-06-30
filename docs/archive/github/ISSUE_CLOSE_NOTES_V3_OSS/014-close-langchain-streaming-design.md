Thanks for the LangChain streaming design discussion.

**Closing as completed:** Opt-in LangChain streaming metadata shipped in **v1.3.0** (`stream: true` — chunk counts, timing, bounded preview; no full token capture by default). See [CHANGELOG.md](../../CHANGELOG.md#130) and fixture `fixtures/traces-v0.2/llm-tokens-and-streaming.jsonl`.

Further streaming **limitations and workarounds** are documented in [docs/STREAMING-LIMITATIONS.md](../../docs/STREAMING-LIMITATIONS.md). Deeper adapter streaming changes remain maintainer-owned.

If a specific streaming gap remains on v3.5.x, open a focused issue with framework version and sample trace.

**Superseded by:** v1.3.0 LangChain streaming metadata + v3 adapter docs
