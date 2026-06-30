# custom-observe starter

Manual `inspectRun` / `step` tracing without framework adapters.

Adoption: [docs/ADOPTION.md](../../../docs/ADOPTION.md)

Deterministic `observe()` demo — no API keys.

```bash
pnpm install
pnpm start
npx agent-inspect list --dir .agent-inspect
npx agent-inspect check .agent-inspect/*.jsonl
```

Safe sharing: run `npx agent-inspect redact --profile share` before posting traces.
