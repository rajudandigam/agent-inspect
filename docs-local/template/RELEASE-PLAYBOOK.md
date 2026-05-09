# Release playbook

## Prerequisites

- Repository is the template (or your fork) with changesets and publish workflow in place.
- You have publish rights to the npm package.

## npm Trusted Publishing (OIDC)

The publish workflow uses **Trusted Publishing** so you do not need to store `NPM_TOKEN` in GitHub secrets.

1. **On npmjs.com**
   - Open your package (or create it first with a manual publish).
   - Go to **Package settings** → **Publishing access** → **Configure Trusted Publishers**.
   - Add a **GitHub** trusted publisher:
     - **Repository owner**: your GitHub org or username.
     - **Repository name**: e.g. `oss-npm-lib-template` (or your repo).
     - **Workflow name**: `release.yml` (must match the filename under `.github/workflows/`).
     - **Environment (optional)**: leave blank unless you use environments.

2. **In the repo**
   - `.github/workflows/publish.yml` already requests `id-token: write` and uses the default `registry-url` for npm.
   - The changesets/action runs `npm run release` which runs `changeset publish`.

3. **First time**
   - Ensure the package name in `package.json` exists on npm (create it with a manual `npm publish` once if needed).
   - After that, Trusted Publishing can perform all future publishes from the workflow.

## Releasing

1. **Make changes** on a branch; merge to `main` after review.

2. **Add a changeset** (on a branch or main):
   ```bash
   npx changeset
   ```
   - Choose the version bump (patch/minor/major).
   - Write a short summary for the changelog.
   - Commit the new file under `changeset/`.

3. **Push to main**
   - CI runs (typecheck, unit, size, Playwright).
   - The Release workflow runs after push to `main`. It will:
     - Run `npm run test:all`.
     - Run the changesets/action, which:
       - Versions the package using the changesets.
       - Commits the version bump and changelog.
       - Runs `npm run release` (i.e. `changeset publish`) to publish to npm.
   - If no changeset exists, the action does not publish.

4. **Verify**
   - Check the “Release” workflow run on GitHub.
   - Check npm for the new version and updated changelog.

## Troubleshooting

- **Permission denied (public)**  
  Ensure the npm package has **Trusted Publishers** configured and the workflow file name matches.

- **No changesets**  
  The action will not publish. Add a changeset and push again.

- **Version conflict**  
  Someone may have published the same version. Pull latest, add a new changeset with a bump, and push.
