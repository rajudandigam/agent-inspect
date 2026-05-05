# AgentInspect release readiness

## 1. Current status

- Core API complete (`inspectRun`, `step`, `step.llm`, `step.tool`, `observe`).
- CLI complete (`list`, `view`).
- MVP examples complete (01–05).
- Root and examples README complete; line-count smoke tests guard formatting.
- Unit tests, coverage, and size gate passing locally and in CI.
- Root package remains **`"private": true`** until the intentional first publish (safety).

## 2. Local verification

From the repository root:

```bash
pnpm install
pnpm build
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm size
pnpm test:all
node packages/cli/dist/index.cjs --help
cd examples/01-basic && pnpm install && pnpm start
```

## 3. Package dry-run

After a successful `pnpm build`:

```bash
pnpm pack:dry-run
```

Inspect tarball layout (optional):

```bash
npm pack --dry-run 2>&1 | head -40
```

## 4. Tarball install test

Create a tarball from the repo root (after `pnpm build`; `prepack` will clean and rebuild if you use `npm pack`):

```bash
npm pack
```

Then in a temporary directory (replace the `.tgz` path with the file npm printed):

```bash
mkdir -p /tmp/agent-inspect-smoke
cd /tmp/agent-inspect-smoke
npm init -y
npm install /absolute/path/to/agent-inspect-0.1.0.tgz
```

ESM import smoke:

```bash
node -e "import('agent-inspect').then(m => console.log(Object.keys(m).sort()))"
```

Expect keys to include at least: `inspectRun`, `step`, `observe`.

CLI smoke:

```bash
npx agent-inspect --help
```

If `npx agent-inspect --help` prints nothing in your shell, run `npx agent-inspect` (no args) or invoke the bin directly:

```bash
node node_modules/agent-inspect/packages/cli/dist/index.cjs --help
```

If `npm pack` or install fails only because **`private` is still true**, that is expected for a dry run in some setups; the fix for publish is to remove `private` only at the final publish step (see below), not during readiness work.

## 5. Final publish checklist

1. Confirm **npm package name** `agent-inspect` is available (or owned by the publishing org).
2. Configure **npm Trusted Publishing** (OIDC) for this GitHub repo:
   - Workflow file: **`.github/workflows/publish.yml`** (name must match what you configure on npm).
   - Permissions already include `id-token: write` for provenance.
3. When ready to publish, remove **`"private": true`** from the **root** `package.json` only.
4. Ensure a **changeset** exists (e.g. under `.changeset/`); merge versioning PR from `changesets/action` as usual.
5. Run **`pnpm prepublish:checks`** locally before tagging or merging the release PR.
6. After publish: verify the package on npm and **`npx agent-inspect --help`** / **`npx agent-inspect list`**.

## 6. Do not publish checklist

- Do not publish **`@agent-inspect/core`** or **`@agent-inspect/cli`** (workspace-only; stay `private: true`).
- Do not add **`NPM_TOKEN`** GitHub secrets; use Trusted Publishing + `GITHUB_TOKEN` + OIDC.
- Do not ship advanced runnable examples, adapters, token/cost, replay, SQLite, dashboards, or OpenTelemetry in **v0.1** unless explicitly scoped for a later version.

## 7. Changesets and `private`

While the root package is **`private: true`**, `changeset publish` will not publish to npm. That is correct for this phase.

**When you are ready to publish:**

1. Remove `"private": true` from root `package.json`.
2. Run `pnpm changeset` / merge the release PR as your process requires.
3. Run `pnpm changeset version` when the bot or process opens the versioning PR.
4. Confirm `pnpm prepublish:checks` and `pnpm pack:dry-run`.
5. Merge to `main` so **Publish** workflow runs with a changeset; verify npm and `npx`.
