# AgentInspect release playbook

This repo publishes a single public npm package:

- **Public**: `agent-inspect` (root package)
- **Private workspace-only**: `@agent-inspect/core`, `@agent-inspect/cli` (must remain `private: true`)

No `NPM_TOKEN` is used for automation. Future releases use **npm Trusted Publishing** via GitHub Actions **OIDC**.

## GitHub repo settings (required for release PRs)

GitHub repo → **Settings → Actions → General → Workflow permissions**:

- **Read and write permissions**
- **Allow GitHub Actions to create and approve pull requests**

If these are missing, Changesets may fail with: **“Resource not accessible by integration”**.

## First release

The first release may be manual if the `agent-inspect` package does not exist on npm yet.

### Manual first publish (only when you are ready)

From the repo root:

```bash
pnpm install --frozen-lockfile
pnpm run prepublish:checks
pnpm pack:dry-run
pnpm pack:smoke
```

Confirm npm identity and package name:

```bash
npm whoami
npm view agent-inspect name
```

- If `npm view agent-inspect name` returns **404**, the name is available.
- If it returns an existing package, **stop** and verify ownership before publishing.

Then publish intentionally:

```bash
npm publish --access public
```

After manual publish, verify:

```bash
npm view agent-inspect version
npx agent-inspect --help
npx agent-inspect list
```

## Configure Trusted Publisher (after the package exists)

On npmjs.com:

1. Open the **`agent-inspect`** package.
2. Go to package settings.
3. Add **Trusted Publisher** → **GitHub Actions**.
4. Configure:
   - **GitHub owner**: `rajudandigam`
   - **Repository**: `agent-inspect`
   - **Workflow filename**: `publish.yml` (must match `.github/workflows/publish.yml`)
   - **Environment**: leave blank unless the workflow uses one
5. Save.

After this, future publishes should work via OIDC without any npm token secret.

## Future releases with Changesets

For future releases:

```bash
pnpm changeset
git add .changeset
git commit -m "changeset: describe release"
git push
```

On merge to `main`:

- The **Publish** workflow runs.
- `changesets/action@v1` opens a **release PR** if versioning is needed.
- After the release PR is merged, the workflow publishes via **OIDC** using `changeset publish`.

Do not create or store `NPM_TOKEN` in GitHub secrets for normal publishing.

## Common errors

### Resource not accessible by integration

Cause:

- Missing workflow permissions: `pull-requests: write` and/or `contents: write`
- Repo settings do not allow workflow-created PRs

Fix:

- Ensure workflow permissions include `pull-requests: write` and `contents: write`
- Enable “Allow GitHub Actions to create and approve pull requests” in repo settings

### E404 / auth / “Access token expired”

Common causes:

- npm auth problem (`npm whoami` fails)
- Package does not exist yet (first publish not done)
- Trusted Publisher not configured yet
- Owner/repo/workflow filename mismatch
- npm could not match the OIDC token to the Trusted Publisher config

Fix:

- For the first release, publish manually if the package does not exist
- After it exists, configure Trusted Publisher exactly (owner/repo/workflow filename)
- Confirm the workflow filename is `publish.yml`
- Confirm package name is `agent-inspect`

### `repository.url` normalized

Cause:

- `npm pkg fix` normalizes package metadata (e.g. adds `git+`)

Fix:

- Run `npm pkg fix`
- Review and commit the normalized metadata if correct

### `npx agent-inspect` does not work before publish

Cause:

- `npx agent-inspect` may hit the public registry before the package exists

Fix:

For local tarball tests, use:

```bash
./node_modules/.bin/agent-inspect --help
npm exec -- agent-inspect --help
npx --no-install agent-inspect --help
```

## Final manual release checklist

Before manual first publish:

- README.md is final and npm-friendly
- Root package has no `"private": true`
- Internal packages remain private (`@agent-inspect/core`, `@agent-inspect/cli`)
- `publishConfig.access` is `"public"`
- Package version is `0.1.0`
- No stray changeset bumps first release to `0.1.1`
- `pnpm run prepublish:checks` passes
- `pnpm pack:dry-run` shows expected files only
- `pnpm pack:smoke` passes
- `npm whoami` is the intended npm account
- `npm view agent-inspect name` confirms availability or ownership
- `npm publish --access public` is run intentionally

After publish:

- `npm view agent-inspect version` returns `0.1.0`
- `npx agent-inspect --help` works
- `npx agent-inspect list` works
- npm Trusted Publisher is configured for future releases