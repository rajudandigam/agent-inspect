# Cross-platform packed consumer matrix

**Status:** PARTIAL — evidence from maintainer CI + local smoke scripts; not a full OS×Node grid.  
**Authority:** [implementation/ROADMAP.md](./implementation/ROADMAP.md) · [STABILITY-BASELINE.md](./STABILITY-BASELINE.md)
**Date:** 2026-09-28 · tested baseline `agent-inspect@6.31.11` (CI primary); Windows dated rows provide evidence for #209

## Method

| Source | What it proves |
|--------|----------------|
| GitHub Actions `CI` / `Publish` on `ubuntu-latest` + Node **22** | typecheck, unit, size, release-train gates |
| `pnpm pack:smoke` (`scripts/package-smoke.mjs` + packed E2E scripts) | packed tarball install; root ESM/CJS; manifest-driven JS/type target presence and ESM/CJS loading for every concrete public root subpath; optional-package and packed E2E paths |
| `pnpm compat:smoke` (`scripts/compat-smoke.mjs`) | ESM/CJS consumer fixtures, semantic public-subpath imports, Jest-style CJS, `ts-jest` **Node16**, CLI bin help |

Do **not** infer untested cells as supported.

## Matrix

| Dimension | Claimed target | Evidence | Result |
|-----------|----------------|----------|--------|
| Node 20 | engines `>=20` | engines field; not separately matrixed in CI | **DECLARED** / CI not multi-version |
| Node 22 | CI primary | GHA typecheck/unit/publish | **PASS** |
| Node 24 | Desired | 2026-09-28 native Windows packed-consumer run below; not in GHA matrix | **PASS** for the executed root/subpath slice |
| Node 26 | Desired | Not in GHA matrix and not covered by the dated run below | **UNTESTED** |
| ESM | Supported | pack + compat smoke | **PASS** (CI Linux) |
| CJS | Supported | pack + compat smoke | **PASS** (CI Linux) |
| TypeScript Node16 / NodeNext | Supported | compat `ts-jest-node16`; docs recommend NodeNext/Node16 | **PASS** (fixture) |
| npm consumer | Supported | pack/compat install via npm tarball | **PASS** |
| pnpm consumer | Supported | monorepo + docs guide; CI uses pnpm | **PASS** (repo) / clean consumer **DOCUMENTED** |
| Linux | Supported | GHA ubuntu | **PASS** |
| macOS | Supported intent | Maintainer local Darwin; not GHA matrix | **PARTIAL** |
| Windows | Supported intent | 2026-09-28 manual native Windows + Node 24 evidence below; not in GHA matrix | **PASS** for the #209 root/subpath and optional suite; broader matrix **PARTIAL** |
| Jest 29 / 30 | Reporters packed | pack smoke Jest reporter import | **PARTIAL** (import smoke, not full Jest version matrix) |
| Vitest | Reporters packed | pack smoke Vitest reporter import | **PARTIAL** |

## Dated evidence

| Date | OS | Node | Package managers | Package | Root ESM | Root CJS | Public subpaths ESM | Public subpaths CJS | Result |
|------|----|------|------------------|---------|----------|----------|---------------------|---------------------|--------|
| 2026-08-26 | Native Windows; registry product `Windows 10 Home`, display `25H2`, build `26200.9168` | `v24.13.0` | `pnpm 9.15.0`; `npm 11.17.0` | `agent-inspect@6.17.3` | **PASS** | **PASS** | **PASS** (10/10) | **PASS** (10/10) | `pack:smoke` + `compat:smoke` **PASS** |
| 2026-09-13 | Native Windows 11 (NT 10.0.26200, X64) | `v24.19.0` | `pnpm 9.15.0`; `npm 12.0.2` | `agent-inspect@6.29.0` | **PASS** | **PASS** | **PASS** (10/10) | **PASS** (10/10) | `pack:smoke` + `compat:smoke` **PASS** (all 17 optional packages OK, native `better-sqlite3` rebuild OK with npm 12 allowScripts) |
| 2026-09-28 | Native Windows 11 (NT 10.0.26200, X64) | `v24.19.0` | `pnpm 9.15.0`; `npm 12.0.2` | `agent-inspect@6.31.11` | **PASS** | **PASS** | **PASS** (10/10) | **PASS** (10/10) | `pack:smoke` + `compat:smoke` **PASS** (all 17 optional packages OK, unit suite 309/309 PASS, Windows `--policy` drive path fix verified) |

This Windows + Node 24 row re-validates the root packed-consumer,
public-root-subpath, and full optional-package suite for issue #209 on the 6.31.11
baseline, including a fix for local Windows drive paths in CLI `--policy` redaction. Broader cross-OS automation remains PARTIAL, Node 26
remains untested, and the macOS status is unchanged.

## Retention

Keep this document updated when CI adds OS/Node matrix jobs. Untested cells stay **UNTESTED**, never greenwashed.
