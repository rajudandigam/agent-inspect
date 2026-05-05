# OSS NPM Library Template Blueprint

*(Based on `react-copy-to-clipboard-lite`)*

This document captures a **repeatable, proven workflow** for building a modern OSS npm package with:

- Modern-first implementation
- Tiered fallback
- SSR-safe runtime checks
- TypeScript-first / zero runtime deps
- High unit test coverage
- Cross-browser E2E smoke tests
- ESM + CJS + types packaging
- Size gates
- Professional multi-job GitHub CI
- Trusted publishing readiness
- Real demo app that also powers Playwright

Use this as a **template** for future libraries.

---

## 1) Goals, Principles, and Non-Goals

### Core Goals

- Build a small, modern library with an **engine moat**: deterministic, structured results (metadata).
- Keep runtime dependencies **zero** (dev deps are allowed).
- Support **SSR** and modern frameworks (Next.js / RSC constraints) via **no top-level browser access**.
- Provide:
  - Core function (imperative)
  - Hook (React ergonomics)
  - Component wrapper (migration-friendly)
  - React 19 Actions helper (modern differentiator)

### Non-Goals (Explicit)

- No legacy browser code (no IE, no `window.clipboardData`)
- No `prompt()` fallbacks
- No clipboard-read restore (avoid permission prompts)
- No UI framework / toasts / styling in library

---

## 2) Reference Architecture (Reusable Pattern)

### High-level Package Layers

**Core layer** (framework-agnostic):

- Types
- Permission helper
- Fallback implementation
- Tiered engine

**React layer**:

- Hook wrapping core engine
- Component wrapper using `cloneElement`
- Action helper for React 19

**Packaging layer**:

- Root entry exports
- Subpath exports for `/core` and `/react`

### Folder Structure Template

```
my-lib/
├── src/
│   ├── core/
│   │   ├── types.ts
│   │   ├── permissions.ts
│   │   ├── fallback.ts
│   │   └── engine.ts
│   ├── react/
│   │   ├── useSomething.ts
│   │   ├── Component.tsx
│   │   └── actions.ts
│   ├── index.ts
│   ├── core.ts
│   └── react.ts
├── demo/
│   ├── index.html
│   ├── main.tsx
│   ├── styles.css
│   └── vite.config.ts
├── playwright/
│   └── playwright.config.ts
├── playwright/tests/
│   └── smoke.spec.ts
├── .github/workflows/
│   ├── ci.yml
│   └── publish.yml
├── docs/
│   └── DEV-ARCHITECTURE.md
├── .cursorrules
├── .cursor/rules/architecture.mdc
├── package.json
├── tsup.config.ts
├── vitest.config.ts
├── tsconfig.json
├── README.md
└── LICENSE
```

---

## 3) Public API Contract Pattern (Reusable)

### “Metadata moat”

Return a structured result from core actions.

```ts
export type CopyMethod =
  | "clipboard-api"
  | "exec-command"
  | "unsupported"
  | "failed";

export type CopyErrorCode =
  | "SECURITY_ERROR"
  | "PERMISSION_DENIED"
  | "INSECURE_CONTEXT"
  | "NO_BROWSER_SUPPORT"
  | "UNKNOWN";

export type CopyResult = {
  success: boolean;
  method: CopyMethod;
  code?: CopyErrorCode;
  error?: unknown;
};

export type CopyOptions = {
  clearAfter?: number;
  permissions?: "auto" | "none";
};

export async function copyToClipboard(
  text: string,
  options?: CopyOptions
): Promise<CopyResult>;
```

**Reusable for:**

- storage utilities
- fetch wrappers
- cookie APIs
- permission APIs
- file downloads
- web share
- geolocation

---

## 4) Engine Implementation Approach (Tiered Pattern)

### Bulletproof Tier Blueprint

- **Tier 0** — SSR guard
- **Tier 1** — Modern API (fast path)
- **Tier 1.5** — Permission awareness
- **Tier 2** — Support-check
- **Tier 3** — Fallback implementation
- **Tier 4** — Structured unsupported

### Key Rules

- Never touch `window` / `document` / `navigator` at module top-level
- Catch errors at each tier
- Always cleanup DOM + selection
- Return structured results
- Do not change focus permanently
- Fallback must be deterministic

---

## 5) Cursor + AI Workflow (Reusable)

### A) Single Source of Truth

**Create:** `docs/DEV-ARCHITECTURE.md`

**Include:**

- Goals
- API contract
- Engine tiers
- Repo layout
- Implementation order
- Testing plan
- Packaging plan
- Release plan

### B) Cursor Rules

**`.cursorrules`:**

- Strict TypeScript
- No runtime deps
- SSR-safe checks
- Always return metadata
- No UI assumptions

**`.cursor/rules/architecture.mdc`:**

- One-paragraph description
- Pointer to `docs/DEV-ARCHITECTURE.md`

### C) One-file-at-a-time execution

1. types
2. fallback
3. engine
4. unit tests
5. hook
6. component
7. actions
8. entries
9. e2e
10. docs

---

## 6) Proven Prompt Templates

### Core Engine Prompt

Implement `copyToClipboard(text, options)` per docs. SSR-safe, modern-first via `navigator.clipboard.writeText`, permission-aware best-effort, fallback to `execCommand` using hidden `<textarea>`, always cleanup DOM + selection, always return structured result.

### Fallback Prompt

Implement `copyViaExecCommand(text)` with off-screen textarea, cleanup selection, no throws, return `{ok:false}` on error. Add unit tests.

### Hook Prompt

Implement `useCopyToClipboard` returning `{ copy, copied, error, reset }`, manage timers, cleanup on unmount, no state updates after unmount.

### Component Prompt

Implement `<CopyToClipboard>` using `cloneElement`, preserve child handlers, respect `preventDefault`.

### Action Helper Prompt

Implement `copyToClipboardAction(prevState, formData)` for `useActionState`.

---

## 7) Unit Testing Pattern (Vitest)

### Validations

- SSR returns unsupported
- Modern success path
- Fallback path
- Permission denied behavior
- `permissions: "none"`
- execCommand failure
- Insecure context
- clearAfter scheduling

### Vitest Config

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      thresholds: {
        statements: 95,
        branches: 90,
        functions: 100,
        lines: 95
      }
    }
  }
});
```

---

## 8) E2E Smoke Testing (Playwright)

### Strategy

- Demo app = test harness
- Chromium + Firefox + WebKit
- UI state assertion cross-browser
- OS clipboard assertion Chromium-only

---

## 9) Packaging Pattern (tsup + exports)

### tsup

```ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    core: "src/core.ts",
    react: "src/react.ts"
  },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  outDir: "dist",
  outExtension({ format }) {
    return { js: format === "cjs" ? ".cjs" : ".mjs" };
  }
});
```

### Exports Map

```json
"exports": {
  ".": {
    "types": "./dist/index.d.ts",
    "import": "./dist/index.mjs",
    "require": "./dist/index.cjs"
  }
}
```

### Dist-only publish

```json
"files": ["dist"],
"sideEffects": false
```

---

## 10) Bundle Size Gate

### size-limit config

```json
"size-limit": [
  { "path": "dist/index.mjs", "limit": "2 KB" }
],
"scripts": {
  "size": "size-limit"
}
```

---

## 11) CI Pattern

### Jobs

- install/build
- typecheck
- unit tests
- size gate
- playwright
- artifacts upload

### Philosophy

- Fast checks first
- Required checks
- Separate publish workflow

---

## 12) Release / Publish (Changesets + OIDC)

### Changesets PR flow

- `changesets/action@v1`

### GitHub permissions

- `pull-requests: write`
- `contents: write`

### OIDC trusted publishing

- Avoid manual tokens

---

## 13) Demo App Pattern

- No UI dependencies
- CSS theme only
- Real UX examples
- Accessible status
- Keyboard support
- Deployable to Vercel

---

## 14) Reusable Template Checklist

### Phase 0 — Spec

- Write `DEV-ARCHITECTURE.md`
- Add Cursor rules
- Define metadata types

### Phase 1 — Core

- Types
- Permissions
- Fallback
- Engine
- Unit tests

### Phase 2 — React

- Hook
- Component
- Actions

### Phase 3 — Packaging

- tsup
- exports map
- dist-only publish

### Phase 4 — Quality

- coverage
- size-limit
- Playwright
- CI gates

### Phase 5 — Release

- changesets
- OIDC publish
- release notes

### Phase 6 — Adoption

- demo page
- deploy
- README visuals

---

## 15) Most Reusable Assets
-
- `DEV-ARCHITECTURE.md`
- Cursor rules
- tsup + exports
- Vitest config
- Playwright demo harness
- CI multi-job
- size-limit
- Changesets model
- Metadata moat API
