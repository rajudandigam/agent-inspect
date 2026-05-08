# Recipe: parallel-tools

## What this demonstrates

**Promise.all** over multiple `step.tool` calls with different (short) artificial delays. In the trace, tools are **siblings** under the parent step—**not** nested by wall-clock order alone.

## Why this matters

Parallel fan-out is common (search, pricing, policies). If you mis-model it, your tree looks sequential and misleads debugging. AgentInspect keeps explicit **parent/child** from `step()` structure, not from timestamps.

## How to run

```bash
pnpm build
cd examples/recipes/parallel-tools
pnpm install
pnpm start
```

## Expected output

See `expected-output.txt` for marker substrings (`Parallel batch`, `FIX`, `150.25`).

## What to look for

Under **parallel-batch**, you should see **slow-stock-quote** and **fast-fx-rate** as sibling children (order may follow completion—check `view` output).

## Notes and limitations

- Delays are tiny and only for demonstration.
- Not a load test.

## Version ownership

v0.9 adoption hardening (recipes pass 2).
