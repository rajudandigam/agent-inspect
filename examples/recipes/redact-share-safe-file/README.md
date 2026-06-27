# Recipe: redact-share-safe-file

## What this demonstrates

Using `@agent-inspect/redact` to create a share-safe local copy of a synthetic trace-like JSON object.

## Why this matters

Redaction is a local transformation, not an upload step. The source object is left untouched, the redacted copy can be written to a local file, and findings describe detector IDs and paths rather than printing sensitive values.

## How to run

From the repository root:

```bash
pnpm build
cd examples/recipes/redact-share-safe-file
pnpm install
pnpm start
```

Equivalent CLI shape:

```bash
npx agent-inspect redact trace.jsonl --profile share --json
```

## Expected output

See `expected-output.txt`.

## What to look for

- `share` redacts IDs and contact-like keys for PRs or internal support threads.
- `strict` is available for public or external sharing and also redacts prompt/output/context-like keys.
- Findings are safe to print in CI logs because previews are bounded and detector-owned.

## Boundaries

- Redaction profiles are key-based safeguards, not compliance-grade DLP.
- Review every generated artifact before sharing.
- No network calls, hosted upload, or mutation of the source object.
