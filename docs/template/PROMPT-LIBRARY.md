# Prompt library (Cursor prompts)

Use these prompts when implementing or changing parts of the library. Replace placeholders like `runEngine` / `RunEngine` with your actual API names when using this for a forked library.

---

## Engine

**Prompt:** Implement `runEngine(input, options)` per docs/DEV-ARCHITECTURE.md. SSR-safe: no top-level `window`/`document`/`navigator`. Tier 0: return unsupported + NO_SUPPORT when window or document is missing. Tier 1: fast path (e.g. non-empty short input). Tier 2: fallback (e.g. empty or edge case). Tier 3: structured failure with method and optional code. Always return a structured result `{ success, method, code?, error? }`. Add unit tests for SSR, fast path, fallback, and failed cases.

---

## Hook

**Prompt:** Implement `useEngine(options)` that wraps `runEngine`. Return `{ run, running, lastResult, reset }`. On `run(input)`, set running true, call `runEngine(input, options)`, then set lastResult and running false. Do not update state after unmount (use a ref to track mounted). Clean up in useEffect on unmount. Add unit tests for initial state, run updates lastResult, reset clears lastResult, and options passed to runEngine.

---

## Component

**Prompt:** Implement `<RunEngine input="..." onResult onSuccess onError>{child}</RunEngine>`. Use `cloneElement` to inject an onClick that: (1) calls the child’s onClick if present, (2) if the event is not defaultPrevented, call `runEngine(input)` and then invoke onResult, and onSuccess or onError depending on the result. Preserve other child props. Add unit tests for click runs engine, onSuccess/onError called correctly, and preventDefault skips running the engine.

---

## Actions

**Prompt:** Implement `runEngineAction(prevState, formData)` for use with React 19 `useActionState`. Read `"input"` from formData (string or empty string). Call `runEngine(input)` and return state `{ result, error }`. On success set error to null; on failure set error from result.code or result.error. Catch thrown errors and return state with result null and error message. Export `initialState`. Add unit tests for formData input, missing input, failure state, and thrown error.

---

## Tests

**Prompt:** Add Vitest unit tests for [engine/hook/component/actions]. Use jsdom. Mock only the core engine where testing React code. Cover: happy path, failure path, edge cases (empty input, SSR for engine). Assert structured result shape and that no state updates happen after unmount for the hook.

---

## Packaging

**Prompt:** Ensure package.json exports map has ".", "./core", "./react" with types, import, and require. tsup.config.ts entry keys match. Build outputs dist/*.mjs, dist/*.cjs, and dist/*.d.ts. Demo vite.config.ts resolve.alias points at dist/*.mjs. No runtime dependencies; peerDependencies only for React.

---

## CI

**Prompt:** CI workflow: jobs typecheck, unit (with coverage artifact), size (after build), playwright (after unit and size). Use Node 20, npm ci. Upload coverage and playwright-report artifacts on failure/success as needed. Concurrency group on ref. No secrets required for CI.

---

## Release

**Prompt:** Release workflow: on push to main, run test:all then changesets/action with publish command `npm run release`. Permissions: contents write, pull-requests write, id-token write (OIDC). Document in RELEASE-PLAYBOOK that npm Trusted Publishing must be enabled in npm package settings and linked to this GitHub repo.
