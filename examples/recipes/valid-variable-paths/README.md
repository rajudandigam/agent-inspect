# Recipe: valid-variable-paths (#491)

One TraceContract that accepts legitimate variation (lookup→answer, optional
formatting) while failing safety (prohibited refund), missing prerequisite,
bad result dependency, and excess retry.

Also includes Anitesh’s seven-event **metadata-only** safe/broken pair
(normalized semantic events — not padded writer lifecycle noise).

Synthetic / keyless. Not a Mastra/LangChain integration claim.

## Run

```bash
pnpm --filter agent-inspect-recipe-valid-variable-paths start
```
