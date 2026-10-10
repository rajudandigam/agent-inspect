# Recipe: timeout-ledger-effects (#492 / Navya)

Keyless in-process fake ledger: the handler is actually invoked. Shows what
committed after a timeout without claiming exactly-once or real financial
effects. Four independent surfaces: injected fault, committed ledger records,
subsequent agent actions, and a structured completion claim.

Synthetic only. Not Heimdall field invention.

## Run

```bash
pnpm --filter agent-inspect-recipe-timeout-ledger-effects start
```
