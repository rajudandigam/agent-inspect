## Summary

<!-- What does this PR change and why? Link issue: # -->

## Type of change

- [ ] Bug fix (non-breaking)
- [ ] Documentation only
- [ ] Example / recipe / fixture
- [ ] Feature or enhancement (scoped)
- [ ] Breaking change (requires major version plan — maintainer approval required)

## Product boundaries (check all that apply)

- [ ] Local-first only — no network upload added
- [ ] No new vendor sinks
- [ ] No SaaS / dashboard scope added
- [ ] `schemaVersion: "0.1"` manual traces remain compatible (or breaking change is documented for v2)
- [ ] No `step_failed` event introduced
- [ ] `inspectRun` default tracing behavior unchanged (unless issue explicitly requested opt-out)

## Packages touched

- [ ] `agent-inspect` (root)
- [ ] `@agent-inspect/core`
- [ ] `@agent-inspect/cli`
- [ ] `@agent-inspect/langchain`
- [ ] `@agent-inspect/tui`
- [ ] Docs / community only

## Validation

<!-- Paste commands run and results -->

```bash
# Docs-only minimum:
pnpm typecheck
pnpm test

# Runtime / export changes:
pnpm test:all
pnpm pack:smoke
# npm pack --dry-run  # if package files/exports changed
```

## Screenshots / sample output

<!-- CLI output, trace snippets, or doc previews if relevant -->

## Checklist

- [ ] Tests added or updated (if behavior changed)
- [ ] Docs updated (`docs/`, `README.md`, or community docs as appropriate)
- [ ] No new runtime dependencies without approval
- [ ] No version bump in this PR (Changesets used for releases)
- [ ] No secrets, production logs, or real PII in commits
