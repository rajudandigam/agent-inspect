# Template guide — renaming for a new library

Use this checklist when turning this template into your own npm library. Do every step; order matters where noted.

## 1. Package identity

- [ ] **package.json**
  - `name`: change `oss-npm-lib-template` → your package name (e.g. `my-cool-lib`).
  - `description`: set to your library’s description.
  - `repository.url`: replace `YOUR_GITHUB_USERNAME/oss-npm-lib-template` with your org/repo.
  - `bugs.url`: same repo, `/issues`.
  - `homepage`: same repo, `#readme`.

## 2. Repository URLs

- [ ] **README.md** — Replace any template repo links with your repo URL.
- [ ] **docs/** — In TEMPLATE-GUIDE, PROMPT-LIBRARY, playbooks, replace template repo references with your repo.

## 3. Exports and entry names

If your library has different entry points:

- [ ] **package.json** `exports` — Adjust keys (e.g. keep `.`, `./core`, `./react` or rename).
- [ ] **tsup.config.ts** — Match `entry` keys to export paths (e.g. `index`, `core`, `react`).
- [ ] **demo/vite.config.ts** — Update `resolve.alias` to match your `dist` filenames (e.g. `@lib` → `dist/index.mjs`).

## 4. Source code renames

- [ ] **src/core/** — Rename `engine.ts` / types to your domain (e.g. `copy.ts`, `types.ts`). Update types (`EngineResult` → your result type, etc.).
- [ ] **src/react/** — Rename `useThing.ts` to your hook name (e.g. `useCopy.ts`). Rename `Component.tsx` and `actions.ts` as needed.
- [ ] **src/index.ts**, **src/core.ts**, **src/react.ts** — Re-export your actual symbols and fix imports.

## 5. Tests

- [ ] **src/core/__tests__/** — Rename `engine.test.ts` and update describe/it to your API.
- [ ] **src/react/__tests__/** — Rename and update useThing.test, Component.test, actions.test.
- [ ] **playwright/tests/smoke.spec.ts** — Point at your demo UI (same structure is fine; update text/selectors if you change the demo).

## 6. Demo app

- [ ] **demo/main.tsx** — Replace template “engine” usage with your library’s API (hook, component, imperative).
- [ ] **demo/index.html** — Update `<title>` and any meta if desired.
- [ ] **demo/vite.config.ts** — Alias names already point at `dist`; only change if you changed entry names.

## 7. GitHub workflows

- [ ] **.github/workflows/ci.yml** — No renames required; job names are generic. Optionally add env or matrix for your needs.
- [ ] **.github/workflows/publish.yml** — No renames required. Ensure npm package has **Trusted Publishing** configured (see RELEASE-PLAYBOOK.md).

## 8. Docs and Cursor

- [ ] **docs/DEV-ARCHITECTURE.md** — Rewrite for your library: goals, API contract, engine tiers, layout, release flow.
- [ ] **docs/PROMPT-LIBRARY.md** — Keep structure; replace “engine”/“RunEngine” with your function/component names in prompts.
- [ ] **docs/RELEASE-PLAYBOOK.md** — Update repo/project name if needed; OIDC steps stay the same.
- [ ] **.cursorrules** — Keep strict rules; point to your `docs/DEV-ARCHITECTURE.md` if path is unchanged.
- [ ] **.cursor/rules/architecture.mdc** — Update the one-line description and pointer to `docs/DEV-ARCHITECTURE.md` for your project.

## 9. Optional cleanups

- [ ] Remove or repurpose `GPT-SUGGESTED_TEMPLATE.md` / `NPM-LIBRARY-TEMPLATE.md` if you don’t need them.
- [ ] Add a real **LICENSE** (this repo uses MIT) and keep copyright notice.
- [ ] Set `publishConfig.access` in package.json if you need restricted access.

After renaming, run: `npm run test:all` (typecheck, unit, build, size, Playwright) and fix any failures.
