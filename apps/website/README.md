# AgentInspect Website

Private marketing site and docs shell for AgentInspect.

## Local dev

```bash
pnpm --filter @agent-inspect/website dev
```

Or from the monorepo root:

```bash
pnpm website:dev
```

## Build

```bash
pnpm --filter @agent-inspect/website build
```

Static output is written to `apps/website/out`.

## Typecheck

```bash
pnpm --filter @agent-inspect/website typecheck
```

## Vercel setup

Project source:

`rajudandigam/agent-inspect`

Root Directory:

`apps/website`

Framework:

Next.js

Build Command:

`pnpm build`

Output Directory:

`out`

Install Command:

`pnpm install --frozen-lockfile`

Because this is a monorepo, configure Vercel with:

- **Root Directory:** `apps/website`
- **Install Command:** `cd ../.. && pnpm install --frozen-lockfile`
- **Build Command:** `pnpm build`
- **Output Directory:** `out`

If Vercel monorepo install from the app directory fails to resolve the workspace, set the install command to run from the repository root as shown above.

## Notes

- The website package is private and is not published to npm.
- The root package continues publishing only library artifacts (`files` allowlist excludes `apps/`).
- Static export is enabled (`output: "export"`).
- No analytics scripts, forms, auth, or backend routes in this first pass.
- Canonical docs remain on GitHub during the docs migration.
