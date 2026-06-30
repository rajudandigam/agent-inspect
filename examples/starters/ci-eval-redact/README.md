# ci-eval-redact starter

Generates a trace, then use check/eval/redact locally in CI.

```bash
pnpm install && pnpm start
npx agent-inspect check .agent-inspect/*.jsonl
```

Safe sharing: `npx agent-inspect redact ... --profile share`
