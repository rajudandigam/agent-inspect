# Community extension registry

> **v3 scope:** documentation and badge criteria only. There is no npm marketplace, automatic package scanner, or hosted registry service.

Third-party extensions for agent-inspect (adapters, transforms, renderers, indexers) are listed and supported through **maintainer-reviewed documentation**, not runtime plugin loading in root `agent-inspect`.

Authoring contracts live in [V3-EXTENSION-CONTRACTS.md](./proposals/V3-EXTENSION-CONTRACTS.md). Implementation helpers ship in [`@agent-inspect/adapter-sdk`](https://www.npmjs.com/package/@agent-inspect/adapter-sdk).

Official adapters remain governed by [ADAPTER-CONFORMANCE.md](./ADAPTER-CONFORMANCE.md). This document covers **community** extensions.

---

## 1. What qualifies as an extension

| Kind | Package pattern | Contract |
| ---- | --------------- | -------- |
| Framework adapter | `@your-scope/agent-inspect-*` or scoped `@agent-inspect/*` (maintainer-invited) | `TraceAdapter` via adapter-sdk registration |
| Trace transform | optional package | `TraceTransform` — pure, local, no schema version change |
| Trace renderer | optional package | `TraceRenderer` — bounded string output, redaction-aware |
| Trace indexer | optional package | `TraceIndexer` — derived, rebuildable; JSONL on disk stays authoritative |

Out of scope for community listing: hosted dashboards, SaaS indexers, replay engines, cost/token platforms, OpenTelemetry exporters marketed as replacements for local traces.

---

## 2. Compatibility matrix (community)

Maintainers and authors maintain a **package-level** row in their README (or linked `COMPATIBILITY.md`). The repo does not host a dynamic database.

### Required columns

| Column | Description |
| ------ | ----------- |
| Package | npm name + semver range tested |
| Extension type | adapter / transform / renderer / indexer |
| `agent-inspect` peer | Supported core version(s), e.g. `^2.6.0` |
| Node | Supported Node LTS lines |
| Framework / surface | e.g. `ai` SDK 4.x, custom ETL, Markdown export |
| Capture default | `metadata-only` (required for adapters) |
| Conformance | `adapter-sdk` runner result or link to fixture repo |
| Privacy | Link to redaction / metadata policy |
| Maintainer | GitHub org or contact |
| Status | `experimental` / `stable` / `deprecated` |

### Example row

```markdown
| my-agent-inspect-foo | adapter | agent-inspect ^2.6 | Node 20–22 | Foo SDK 1.x | metadata-only | [fixtures](https://…) pass | [policy](https://…) | @acme | experimental |
```

Official packages are listed in [ADAPTER-CONFORMANCE.md](./ADAPTER-CONFORMANCE.md) and the implementation matrix JSON. Community packages **must not** imply official status without maintainer approval.

---

## 3. Badge criteria

Badges are **documentation signals**, not cryptographic guarantees.

### `community-extension` (self-serve)

An extension may display this badge when **all** are true:

1. Published on npm with public `repository` and `license` fields.
2. Declares `agent-inspect` as a **peer** dependency (not a hidden root import).
3. Documents metadata-only default for adapters; no upload-by-default behavior.
4. Includes a no-network conformance or fixture test script in CI.
5. README links to this registry doc and states **community** (not official) status.

### `conformance-tested` (author-claimed)

Add when the package runs `runAdapterConformance` (adapters) or equivalent contract tests (transform/renderer/indexer) in CI and publishes logs or badge linking to a public workflow.

### `maintainer-listed` (repo doc only)

Reserved for extensions **explicitly linked** from agent-inspect docs after maintainer review (see §5). Do not use this label without a merged docs PR.

---

## 4. Contribution policy

### Proposing a listing

1. Open a GitHub issue using the **Community extension** template (or a plain issue) with:
   - npm package name and repository URL
   - extension type and one-paragraph scope
   - conformance evidence (CI link or fixture path)
   - privacy / redaction statement
2. Maintainers triage within best effort; no SLA.
3. **Docs-only merge** adds a row to a future `docs/COMMUNITY-EXTENSIONS.md` index (curated list) — not automatic on npm publish.

### Requirements for merge

- No dependency from `agent-inspect` core on the community package.
- No schema-breaking persisted event changes.
- Adapter packages pass `runPrivacyChecklist` with `metadata-only` default documented.
- Tests run without network access.
- License compatible with MIT ecosystem norms (maintainer discretion).

### Rejection / removal grounds

- Undocumented exfiltration or default cloud upload.
- Monkey-patching root CLI without explicit user opt-in.
- Repeated conformance failures or abandoned security issues.
- Misuse of official branding or `maintainer-listed` without approval.

---

## 5. Maintainer responsibilities

| Role | Responsibility |
| ---- | -------------- |
| **Extension author** | Semver, security fixes, conformance CI, accurate matrix row |
| **agent-inspect maintainers** | Official packages, contract stability, curated doc links, security triage for reported community packages |
| **Consumers** | Pin versions, review privacy docs, run `adapter-sdk` checks before production |

Maintainers **do not** audit every community release. Listing is **best-effort curation**, not endorsement of correctness for every edge case.

---

## 6. Security review checklist

Use this before claiming `conformance-tested` or requesting `maintainer-listed`.

### Packaging

- [ ] Package name does not impersonate `@agent-inspect/*` unless invited.
- [ ] `files` / `exports` publish only intended artifacts (no `.env`, keys, local traces).
- [ ] No `postinstall` scripts that reach the network or modify global config.

### Data handling

- [ ] Default capture is metadata-only (adapters).
- [ ] Raw prompts, messages, tool I/O, and auth headers are not persisted by default.
- [ ] Renderers respect `renderWithSafety` bounds or document equivalent limits.
- [ ] Transforms do not bump `schemaVersion` on disk.

### Runtime

- [ ] No silent background upload or telemetry to third parties.
- [ ] Failures in extension code do not throw through user agent code (degrade gracefully).
- [ ] Optional indexers are rebuildable from JSONL; no mandatory SQLite in consumer apps.

### Supply chain

- [ ] CI runs tests on tag / main.
- [ ] Dependencies are justified; no typosquat or unknown postinstall deps.
- [ ] SECURITY.md or issue contact documented.

---

## 7. Related docs

- [V3-EXTENSION-CONTRACTS.md](./proposals/V3-EXTENSION-CONTRACTS.md) — interface definitions
- [ADAPTER-CONFORMANCE.md](./ADAPTER-CONFORMANCE.md) — official adapter matrix
- [ADAPTERS.md](./ADAPTERS.md) — adoption paths for supported frameworks
- [@agent-inspect/adapter-sdk](https://www.npmjs.com/package/@agent-inspect/adapter-sdk) — registration, conformance, privacy helpers

---

## 8. Non-goals (v3)

- npm marketplace or paid listing
- Automatic crawling of npm for `@agent-inspect` dependents
- Runtime extension registry loaded by default in `agent-inspect` CLI
- Hosted search across community packages

These may be reconsidered only with explicit RFC and demand evidence per [V3.0.0-READINESS-ASSESSMENT.md](./implementation/release-trains/V3.0.0-READINESS-ASSESSMENT.md).
