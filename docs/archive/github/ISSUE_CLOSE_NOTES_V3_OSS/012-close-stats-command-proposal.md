Thanks for the stats command proposal — it informed the local observability CLI trio.

**Closing as completed:** `agent-inspect stats` shipped in **v1.4.0** alongside `timeline` and `search` (see [CHANGELOG.md](../../CHANGELOG.md#140)). Core helpers: `buildTraceStats` in packages/core.

If you need **additional stats dimensions** on v3.5.x (e.g. performance-scale warnings, session-scoped stats), please open a focused follow-up with sample traces and expected summary fields.

**Superseded by:** shipped CLI + scale docs in [docs/PERFORMANCE.md](../../docs/PERFORMANCE.md)
