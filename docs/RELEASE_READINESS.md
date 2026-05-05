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

Create a tarball from the repo root (after `pnpm build`; `npm pack` triggers **`prepack`** which cleans and rebuilds):

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

### CLI after local tarball install

The CLI resolves **`node_modules/.bin/agent-inspect`** to the same file as **`packages/cli/dist/index.cjs`** via symlinks. The entry uses **`realpathSync`** so Commander runs when launched through the bin shim.

Prefer these for **local tarball** verification (no registry lookup):

```bash
./node_modules/.bin/agent-inspect --help
npm exec -- agent-inspect --help
npx --no-install agent-inspect --help
```

Automated check (from repo root, after build):

```bash
pnpm pack:smoke
```

**`npx agent-inspect --help`** (without `--no-install`) may hit the registry or behave differently before the package is public; after publish, verify:

```bash
npx agent-inspect --help
npx agent-inspect list
```

If `npm pack` or install fails only because **`private` is still true**, that is expected for a dry run in some setups; the fix for publish is to remove `private` only at the final publish step (see below), not during readiness work.

## 5. Final publish checklist

1. Confirm **npm package name** `agent-inspect` is available (or owned by the publishing org).
2. Configure **npm Trusted Publishing** (OIDC) for this GitHub repo:
   - Workflow file: **`.github/workflows/publish.yml`** (name must match what you configure on npm).
   - Permissions already include `id-token: write` for provenance.
3. When ready to publish, remove **`"private": true`** from the **root** `package.json` only.
4. Add a **changeset** for the first public version if you use Changesets to drive the release PR; merge the versioning PR as usual.
5. Run **`pnpm prepublish:checks`** locally before tagging or merging the release PR (includes **`pnpm pack:smoke`**).
6. After publish: verify the package on npm and **`npx agent-inspect --help`** / **`npx agent-inspect list`**.

## 6. Do not publish checklist

- Do not publish **`@agent-inspect/core`** or **`@agent-inspect/cli`** (workspace-only; stay `private: true`).
- Do not add **`NPM_TOKEN`** GitHub secrets; use Trusted Publishing + `GITHUB_TOKEN` + OIDC.
- Do not ship advanced runnable examples, adapters, token/cost, replay, SQLite, dashboards, or OpenTelemetry in **v0.1** unless explicitly scoped for a later version.

## 7. Changesets and `private`

While the root package is **`private: true`**, `changeset publish` will not publish to npm. That is correct for this phase.

**First public version target: `0.1.0`** (current `package.json` version). Do **not** keep a stray **patch** changeset that would bump the first publish to **`0.1.1`** unless you intend that.

**When you are ready to publish:**

1. Remove `"private": true` from root `package.json`.
2. Add a changeset if your process requires one for the first public release (or follow your org’s release flow).
3. Run `pnpm changeset version` when the bot opens the versioning PR, if applicable.
4. Confirm `pnpm prepublish:checks` and `pnpm pack:dry-run`.
5. Merge to `main` so **Publish** workflow runs; verify npm and `npx`.

## 8. Final version decision

- Root **`version`** is **`0.1.0`**.
- **First public npm release should be `0.1.0`.**
- A pre-added **patch** changeset alongside **`0.1.0`** would make the first published version **`0.1.1`**, which is usually wrong for a first MVP tag. **Do not** commit a patch changeset for “initial release” unless you explicitly want **`0.1.1`**.

## 9. Package smoke test

From the repo root (runs **`pnpm build`**, then **`npm pack`**, temp install, checks):

```bash
pnpm pack:smoke
```

This verifies:

- **`npm pack`** produces a valid tarball
- **`npm install <tgz>`** in a clean temp project
- **ESM `import('agent-inspect')`** exposes **`inspectRun`**, **`step`**, **`observe`**
- **`./node_modules/.bin/agent-inspect --help`**, **`npm exec -- agent-inspect --help`**, and **`npx --no-install agent-inspect --help`** print help containing **`agent-inspect`**, **`list`**, and **`view`**

To keep the temp dir and tarball for debugging:

```bash
AGENT_INSPECT_KEEP_SMOKE_DIR=true pnpm pack:smoke
```
