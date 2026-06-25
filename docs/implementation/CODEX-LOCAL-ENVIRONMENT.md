# Codex Local Environment

## Setup script

Configure this once in Codex App → Project Settings → Local Environments:

```bash
corepack enable
pnpm install --frozen-lockfile
```

Avoid running the full build in every newly created environment unless required.

## Suggested actions

### Fast check

```bash
pnpm typecheck && pnpm test
```

### Current focused tests

Read the command from `docs/implementation/CURRENT-TASK.md`.

### Runtime gate

```bash
pnpm build &&
pnpm typecheck &&
pnpm test &&
pnpm test:coverage &&
pnpm size &&
pnpm fixtures:check &&
pnpm pack:smoke &&
git diff --check
```

### Package/export gate

```bash
pnpm compat:smoke && npm pack --dry-run
```

### Full release gate

Use `AGENTS.md` and `V1.6.0-RELEASE-READINESS.md`.

## Efficiency rules

- Install once per worktree.
- Use one persistent v1.6 worktree but a fresh thread per chunk.
- Run one or two targeted tests while iterating.
- Run the chunk gate once when the implementation is stable.
- Do not run release readiness until the train is complete.
- Avoid reading generated `dist`, coverage, and lockfiles unless directly relevant.
- Keep external web research to tasks involving current third-party standards/APIs.
