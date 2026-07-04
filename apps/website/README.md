# AgentInspect Website

Private marketing site and docs shell for AgentInspect.

**Live site:** [https://agentinspect.vercel.app/](https://agentinspect.vercel.app/)  
**Live docs:** [https://agentinspect.vercel.app/docs/](https://agentinspect.vercel.app/docs/)

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

This app uses Next.js **static export** (`output: "export"`). Vercel must treat it as a **static site**, not a Next.js server app.

Project source:

`rajudandigam/agent-inspect`

| Setting | Value |
| --- | --- |
| **Root Directory** | `apps/website` |
| **Framework Preset** | **Other** (not Next.js) |
| **Build Command** | `pnpm build` |
| **Output Directory** | `out` |
| **Install Command** | `cd ../.. && pnpm install --frozen-lockfile` |

`apps/website/vercel.json` sets the same values so redeploys stay consistent.

### Why not Framework = Next.js?

With static export, `next build` writes HTML/CSS/JS to `out/` and does **not** produce `routes-manifest.json`. The Next.js preset looks for that file and fails even when the build succeeds.

Install warnings about missing `packages/cli/dist/index.cjs` bins are harmless for the website build (the library packages are not built on this deploy path).

## Notes

- The website package is private and is not published to npm.
- The root package continues publishing only library artifacts (`files` allowlist excludes `apps/`).
- Static export is enabled (`output: "export"`).
- No analytics scripts, forms, auth, or backend routes in this first pass.
- Canonical docs remain on GitHub during the docs migration.
