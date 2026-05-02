# Demo playbook

## Purpose

The **demo** app under `/demo`:

- Shows how to consume the library (hook, component, imperative).
- Serves as the **Playwright test harness** (E2E tests load the demo and assert on UI).

## Setup

- **Build first.** The demo imports from `dist` via Vite aliases. Run:
  ```bash
  npm run build
  ```
- **Dev server:**
  ```bash
  npm run dev:demo
  ```
  Runs Vite with `demo/vite.config.ts`; root is `demo/`, port 5173.

## Aliases (demo/vite.config.ts)

- `@lib` → `dist/index.mjs`
- `@lib/core` → `dist/core.mjs`
- `@lib/react` → `dist/react.mjs`

So in demo you can:

```ts
import { useEngine, RunEngine, runEngine } from "@lib/react";
```

or import from `@lib` / `@lib/core` as needed.

## Playwright

- **Config:** `playwright/playwright.config.ts`.
- **webServer:** `npm run dev:demo`, URL `http://127.0.0.1:5173`, reuse existing server when not in CI.
- **Tests:** `playwright/tests/smoke.spec.ts` — load "/", click buttons, assert status text (no clipboard or OS-specific APIs).

When you add or change demo UI, update the smoke tests so they still assert visible state (e.g. role="status" or data attributes).

## Deploy (optional)

You can build the demo for static deploy (e.g. Vercel):

- From repo root, build the library then build the demo, e.g.:
  ```bash
  npm run build
  cd demo && npx vite build
  ```
- Serve `demo/dist` (or configure your host to point there). The demo uses absolute paths; base must be set if deployed to a subpath.
