## Exports

AgentInspect supports local-only exports from run trees and traces. Exports are intended for **compatibility and sharing**, but should be reviewed before sending to others.

- **CLI usage**: `docs/CLI.md` (`export`)
- **Schema + compatibility guarantees**: `docs/SCHEMA.md`
- **Safety / redaction notes**: `docs/CLI.md`, `SECURITY.md`, and `docs/SCHEMA.md` (redaction section)

## Share-safe exports (v1.3.0+)

Use `--redaction-profile share` (PRs, issues, internal threads) or `strict` (external sharing) when generating an export copy:

```bash
agent-inspect export <run-id> --format markdown --redaction-profile share
```

- Profiles are **key-based** redaction presets — not compliance-grade PII detection.
- Export redaction operates on a **copy** of the run tree; original JSONL traces on disk are **not mutated**.
- **Review** every export before posting — especially when `--include-attributes` is set.

See [SAFE-TRACE-SHARING.md](./SAFE-TRACE-SHARING.md).

Notes:
- Export formats (Markdown/HTML/OpenInference/OTLP JSON) are documented as **experimental / compatibility-oriented** in `docs/API.md`.
- AgentInspect does **not** upload anywhere; exports write local strings/files only.

