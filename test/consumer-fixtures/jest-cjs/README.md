# Jest / CJS consumer fixture

This fixture simulates a **Jest 29 + CommonJS** test file that `require("agent-inspect")`.

Run via `pnpm compat:smoke` or:

```bash
node smoke.test.cjs
```

(from a directory where `agent-inspect` is installed)

**Full Jest runner integration** (with `jest` and `ts-jest` devDependencies) is intentionally out of scope for the root package. If you need a live Jest project smoke, open a follow-up issue or extend CI with an isolated consumer workspace.
