# broken-agent-debugging starter

Canonical keyless **Debug / Prevent / Share** showcase. Three synthetic variants, no API keys, no network.

| Variant | Run id | What it shows |
| --- | --- | --- |
| `good` | `demo-good` | plan → retrieve_policy → rank → generate → observed outcome passes |
| `regression` | `demo-regression` | generate-before-retrieve, duplicate retrieve, failed tool, observed outcome fails |
| `pii` | `demo-pii` | synthetic demo PII with `redact: false`; `verify-safe` reports source risk |

Inbound scripts `pnpm start` / `pnpm run fixed` still work: start is the regression, fixed is the good path.

## Run

From this directory, after `pnpm install` at the repo root (or `npm install agent-inspect` in a copy of this starter):

```bash
node demo-agent.mjs good
npx agent-inspect list --dir .agent-inspect
```

The printed run id is stable (`demo-good`). Then:

### Debug

```bash
npx agent-inspect view demo-good --dir .agent-inspect --summary
npx agent-inspect report demo-good --dir .agent-inspect
npx agent-inspect explain demo-good --dir .agent-inspect
```

### Prevent

```bash
npx agent-inspect check demo-good --dir .agent-inspect \
  --preset trajectory \
  --required-tool retrieve_policy \
  --fail-on-observation failed
```

Expect exit `0`. The regression variant exits `1` with `tool.usage` and `outcome.status` findings:

```bash
node demo-agent.mjs regression
npx agent-inspect check demo-regression --dir .agent-inspect \
  --preset trajectory \
  --required-tool retrieve_policy \
  --forbidden-tool search_docs \
  --fail-on-observation failed
```

### Share

```bash
npx agent-inspect verify-safe demo-good --dir .agent-inspect
npx agent-inspect bundle demo-good --dir .agent-inspect --profile share --out ./evidence
npx agent-inspect bundle verify ./evidence
```

PII walkthrough (synthetic values only):

```bash
node demo-agent.mjs pii
npx agent-inspect verify-safe demo-pii --dir .agent-inspect-pii
npx agent-inspect redact demo-pii --dir .agent-inspect-pii --profile share -o demo-pii.safe.jsonl
```

`verify-safe` can report `SAFE`, `SAFE WITH WARNINGS`, `UNSAFE`, or `UNKNOWN`. Redact writes a derived copy and does not mutate the source. Share-checked is not compliance certification.

Adoption: [docs/FIRST-TRACE-IN-5-MINUTES.md](../../../docs/FIRST-TRACE-IN-5-MINUTES.md)
