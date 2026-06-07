# Add Phoenix/OpenInference import recipe

**Labels:** `exports`, `documentation`, `roadmap-next`

**Difficulty:** Intermediate

## Problem

AgentInspect supports OpenInference-compatible **local** export (experimental), but users lack a careful recipe explaining how an export file might be inspected with Phoenix/OpenInference tooling — without implying vendor upload or universal compatibility.

## Why it matters

Standards-aligned export is ROADMAP Future (~v1.8.0). Docs must use careful compatibility language and preserve the local-first boundary.

## Proposed scope

- Add `docs/PHOENIX.md` **or** `docs/examples/phoenix-import.md` covering:
  - OpenInference-compatible export status (**experimental**)
  - Sample CLI command:
    ```bash
    npx agent-inspect export <run-id> --format openinference --validate
    ```
  - How a user might **locally** inspect JSON with Phoenix-oriented tooling (high level — no Phoenix dependency in repo)
  - Limitations, non-goals, and review-before-sharing guidance
- Link from [docs/EXPORTS.md](../../docs/EXPORTS.md) and optionally [docs/COMPARE.md](../../docs/COMPARE.md).

## Out of scope

- No Phoenix/Arize dependency in repo.
- No vendor upload pipeline or default sink.
- No runtime exporter behavior changes.
- No claim of universal OpenInference or Phoenix compatibility.

## Suggested files

- `docs/PHOENIX.md` or `docs/examples/phoenix-import.md`
- `docs/EXPORTS.md`
- Optional cross-link to OpenInference fixture issue [#7](https://github.com/rajudandigam/agent-inspect/issues/7)

## Acceptance criteria

- [ ] Docs use careful compatibility language (experimental, review before sharing)
- [ ] Docs do not overclaim certification or production APM replacement
- [ ] Docs explain local-first boundary clearly
- [ ] Sample export command documented with fixture/run-id example

## Validation commands

```bash
pnpm typecheck
pnpm test
```

## Notes for contributors

- Comment on this issue before opening a PR.
- Read [docs/EXPORTS.md](../../docs/EXPORTS.md) and existing OpenInference tests before writing claims.
- Coordinate wording with maintainer if comparing to LangSmith/Langfuse/Phoenix production features.

## Maintainer note

OTLP HTTP sink architecture remains maintainer-owned Future work — docs only here.
