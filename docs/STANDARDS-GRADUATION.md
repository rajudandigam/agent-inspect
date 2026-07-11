# Standards graduation: export → review → optional import

How a local AgentInspect trace graduates into standards tooling like Phoenix or another OpenInference consumer, without ever leaving your control. AgentInspect persists **AgentInspect JSONL** locally; standards exports are **compatibility copies**, and **nothing uploads by default** at any step.

```text
local JSONL  →  export (OpenInference / OTLP JSON)  →  redact + review  →  optional, customer-owned import
```

## Step 1 — Export locally

```bash
npx agent-inspect export <run-id> --format openinference --redaction-profile share --validate
npx agent-inspect export <run-id> --format otlp-json --redaction-profile share --validate
```

Both formats are **compatibility-oriented** and **experimental until verified** against your specific backend and version. AgentInspect does not claim universal backend support; validate the file with `--validate` and against the target consumer before relying on it. Committed reference shapes live under [`fixtures/standards/`](../fixtures/standards/).

### Known loss, stated up front

- Kinds without an OpenInference equivalent degrade (`RUN`, `LOGIC`, `ERROR` map to `CHAIN`; `RESULT` to `UNKNOWN`) and every degradation is listed in the export's `warnings`
- Attributes are bounded and metadata-only by default; raw prompts/outputs appear only if you opted into capturing them
- Chain-of-thought is never captured, so it is never exported
- The export is a snapshot, not a live pipeline: later trace changes do not propagate

## Step 2 — Redact and review

Redaction profiles (`share`, `strict`) are **key-based safeguards, not compliance-grade PII detection**. Before any file leaves your machine:

1. Run the export with `--redaction-profile share` (or `strict` for external audiences)
2. Walk the [SAFE-TRACE-SHARING.md](./SAFE-TRACE-SHARING.md) checklist against the exported copy
3. Check for the classics: keys and tokens, customer identifiers, internal hostnames, full prompts or tool I/O, paths exposing usernames

The original JSONL on disk is never mutated by an export.

## Step 3 — Optional, customer-owned import

Importing into Phoenix, Langfuse, or any other consumer is **your step, on your infrastructure**. AgentInspect ships no Phoenix dependency, no collector, and no upload path; the recipes below run entirely against software you host:

- [Phoenix / OpenInference import recipe](../examples/recipes/phoenix-openinference-import/) — local, deterministic walkthrough of feeding an exported file to an OpenInference consumer
- [Langfuse self-hosted import recipe](../examples/recipes/langfuse-local-import/) — same pattern for a self-hosted Langfuse
- Manual vendor guides: [New Relic](./vendors/NEW-RELIC.md) · [Datadog](./vendors/DATADOG.md) · [Honeycomb](./vendors/HONEYCOMB.md)

If an import fails, compare the file against the committed fixtures under [`fixtures/standards/`](../fixtures/standards/) and the format notes in [STANDARDS.md](./STANDARDS.md) before assuming trace corruption; backend schema versions differ.

## Non-goals

- **No default upload** — every step above is explicit and local-first
- **No hosted Phoenix** — import targets are customer-owned deployments
- **No exporter dependency creep** — no Phoenix/vendor SDKs are added to any package
- **No universal compatibility claim** — "OpenInference-compatible" means shape-compatible and experimental until verified against your backend

## Related

- [STANDARDS.md](./STANDARDS.md) — format reference and fixtures
- [EXPORTS.md](./EXPORTS.md) — export CLI flags and redaction profiles
- [SAFE-TRACE-SHARING.md](./SAFE-TRACE-SHARING.md) — the review checklist this guide depends on
- [LIMITATIONS.md](./LIMITATIONS.md) — compatibility boundaries
