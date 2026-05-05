# CI playbook

## Workflow: `.github/workflows/ci.yml`

Runs on **pull_request** and **push** to **main**.

### Jobs

1. **typecheck**
   - `npm ci` then `npm run typecheck`.
   - No artifacts.

2. **unit**
   - Depends on typecheck.
   - `npm run test` (Vitest).
   - Uploads **coverage** artifact (always, so you can inspect after failure).

3. **size**
   - Depends on typecheck.
   - `npm run build` then `npm run size` (size-limit).
   - Fails if bundle exceeds limits in package.json.

4. **playwright**
   - Depends on unit and size.
   - Installs Playwright browsers with deps, builds, then `npm run test:pw`.
   - Uploads **playwright-report** artifact (always).

### Concurrency

- Group: `ci-${{ github.ref }}`, cancel in progress.

### No secrets

- CI does not need NPM_TOKEN or any other secrets.
- Publish uses OIDC (see RELEASE-PLAYBOOK.md).

### Local parity

Run the same gates locally:

```bash
npm run test:all
```

This runs: typecheck → test → build → size → test:pw.
