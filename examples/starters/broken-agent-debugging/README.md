# broken-agent-debugging starter

Deterministic demo: agent calls the wrong tool, step fails, you inspect and redact locally.

No API keys. No network.

## Run

```bash
pnpm install
pnpm start
npx agent-inspect list --dir .agent-inspect
npx agent-inspect report <run-id> --dir .agent-inspect
npx agent-inspect check .agent-inspect/*.jsonl
npx agent-inspect redact .agent-inspect/*.jsonl --profile share -o safe.jsonl
npx agent-inspect verify-safe safe.jsonl
```

## Fix flow

```bash
pnpm run fixed
npx agent-inspect diff .agent-inspect/<old-run>.jsonl .agent-inspect/<new-run>.jsonl
```

## What to look for

- Failed `step.tool` with `status: "error"` in the trace
- `report` highlights the first failing step
- `redact --profile share` before posting artifacts anywhere

Adoption: [docs/FIRST-TRACE-IN-5-MINUTES.md](../../../docs/FIRST-TRACE-IN-5-MINUTES.md)
