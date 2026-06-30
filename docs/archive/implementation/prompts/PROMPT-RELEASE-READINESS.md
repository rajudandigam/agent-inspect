# Codex prompt — release readiness

Read `AGENTS.md` first.

Prepare release readiness for the active AgentInspect train.

Do not create versions, changesets, tags, GitHub releases, or npm publications in this task.

Run:

```bash
git status --short
git branch --show-current
git pull --ff-only origin main
git log -5 --oneline
git diff --check
```

Read:

- `docs/implementation/RELEASE-TRAIN-STATE.md`
- `docs/implementation/CURRENT-TASK.md`
- active release-train execution plan
- package manifests
- README.md
- ROADMAP.md
- CHANGELOG.md
- docs/API.md
- docs/CLI.md
- docs/SCHEMA.md
- docs/LIMITATIONS.md
- docs/KNOWN-ISSUES.md

Run full gate:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm fixtures:check
pnpm recipes:check
pnpm size
pnpm test:all
pnpm pack:smoke
pnpm compat:smoke
npm pack --dry-run
git diff --check
```

Also run all package-specific smoke tests for new public packages.

Create/update:

```text
docs/implementation/release-trains/<TRAIN>-RELEASE-READINESS.md
```

Include:

- scope;
- files/packages changed;
- validation evidence;
- package contents;
- compatibility notes;
- security/no-network evidence;
- known warnings;
- release notes draft;
- release-prep checklist;
- stop conditions.

Stop and ask for explicit release-prep authorization.
