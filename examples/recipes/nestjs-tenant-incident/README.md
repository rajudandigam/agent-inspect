# Recipe: nestjs-tenant-incident (Uduak / W14)

Real NestJS `TestingModule` bootstrap (not a Nest-shaped mock). Keyless stubbed
policy retrieval + answer. One supported causal claim: the answer must consume
the policy result for the **requested** tenant.

| Variant | Expectation |
| --- | --- |
| good (tenant A → policy A) | contract pass |
| broken (tenant A request binds policy B) | contract fail |

Synthetic tenants only. No private Navan data.

## Run

```bash
pnpm --filter agent-inspect-recipe-nestjs-tenant-incident start
```
