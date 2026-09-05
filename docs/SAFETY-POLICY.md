# Safety policy (local share checks)

**Status:** experimental contract for AgentInspect **6.9+**  
**Authority:** Stability and Focus roadmap §10 · [V6.9.0-EXECUTION-PLAN.md](./implementation/release-trains/V6.9.0-EXECUTION-PLAN.md)

AgentInspect provides a **best-effort share check** that verifies a local artifact against a **configured local policy**. It is **not** a compliance, privacy, security, or regulatory certification.

## Language

Use:

| Preferred | Avoid |
|-----------|--------|
| best-effort share check | certified safe |
| verified against the configured local policy | compliant / audit certified |
| redacted artifact | guaranteed PII-free |

## Two assessments

```text
source trace  →  sourceAssessment   (informational / debugging)
     ↓ redact
redacted artifact  →  artifactAssessment  (gates share-safe bundle output)
```

Only the **artifact** assessment controls whether a share-oriented bundle may be written. Source findings must not refuse a bundle when redaction successfully removes blocking content from the artifact.

## Profiles

**Redaction profiles** (data transform): `local` · `share` · `strict`

**Verification policies** (finding severity / gate): `development` · `share` · `strict`

Do not overload redaction and verification in docs or UX.

## Finding model (additive; 6.9-1+)

```ts
interface SafetyFinding {
  category:
    | "credential"
    | "personal-data"
    | "identifier"
    | "raw-content"
    | "path"
    | "size"
    | "structure";
  confidence: "high" | "medium" | "low";
  detector: string;
  path: string;
  action: string;
  severity: "error" | "warning" | "info";
}
```

Policy defaults (product decision for this train):

| Confidence × category | Default severity |
|----------------------|------------------|
| high credential | error |
| high personal-data (share/strict) | error |
| medium identifier | warning |
| low heuristic | info |
| oversized (by limit) | warning or error per policy |
| reader failure | status `UNKNOWN`, fail closed |

Never emit the matched secret/PII value in CLI/MCP/Studio output.

## Precision principles (6.9-2+)

- Prefer **semantic paths** over bare key names (e.g. `tokenUsage.input` is not a prompt).
- **Token configuration fields** (`ls_max_tokens`, `max_tokens`, `token_count`, …) are **not** credentials by key alone (6.14.2+). Real secret values (`Bearer …`, `sk-…`, JWTs, …) still fail via value detectors.
- Credit-card candidates require digit length, Luhn, boundaries, and must not be UUID / trace IDs / counts / timestamps.
- Email detection must not treat `@` in paths, scoped packages, or source maps as addresses.
- UUIDs are **identifiers**, not financial data.
- Framework keys such as `currentTask`, `userInput`, `requestText` are raw-content / PII-risk, not generic metadata.

## False-positive corpus

Canonical synthetic cases live under [`fixtures/safety/`](../fixtures/safety/). Expected outcomes are per verification policy (`local`/`development`, `share`, `strict`). Corpus fixtures are synthetic only—no production customer data.

## Network and privacy

- No network I/O in scan / verify-safe / redact / bundle safety paths.
- Defaults must not weaken existing redaction.
- Overrides require explicit local configuration (below).

## Custom overrides (local only)

Overrides are **opt-in**, **local**, and must not be framed as “making the product less safe by default.” Prefer fixing capture (metadata-only) or raising the redaction profile before adding exceptions.

### Allowed override patterns

1. **Extra sensitive keys** via `@agent-inspect/redact` `extraKeys` / `createRedactor({ extraKeys: [...] })` when your framework uses custom attribute names.
2. **Custom detectors** via `detectors: [myDetector]` on `redact` / `createRedactor` for org-specific token shapes (keep detectors from emitting matched values into logs). Example (synthetic only):

```ts
import { redact, type RedactionDetector } from "@agent-inspect/redact";

const houseDetector: RedactionDetector = {
  id: "custom.houseCredential",
  severity: "error",
  matchKind: "value",
  detect({ value }) {
    if (typeof value !== "string") return [];
    return /^house_credential=[A-Za-z0-9_-]{12,}$/.test(value)
      ? [{ action: "replace" }]
      : [];
  },
};

redact(
  { note: "house_credential=syntheticOnlyValue" },
  { detectors: [houseDetector] },
);
```

3. **Bounded local CLI policy** via `--policy ./agent-inspect.redaction.json` on `redact` and `verify-safe` (6.18+, experimental). See [Bounded local CLI policy](#bounded-local-cli-policy-618) below. Do not put secrets on the command line.
4. **CLI size thresholds** on `scan` / `verify-safe` (`--max-string-length`, etc.) when oversized findings are false positives for your workload.
5. **Bundle write override** with explicit `--allow-unsafe` after reviewing `verify-safe --explain` (records that the artifact was not share-gated).

High-confidence built-in credentials (including bounded `token=` / `api_key=` / `internal_token=` forms) are covered by built-in redaction profiles. Context-sensitive findings such as private filesystem paths may remain verification-only when automatic erasure would create excessive false positives or destroy legitimate debugging context. `redact` remains best-effort; `verify-safe` remains the final automated local assessment before sharing.

### Disallowed

- Shipping weakened default profiles in shared configs without review
- Disabling detectors globally “to make CI green”
- Printing matched secret/PII values in CI logs or MCP tool output
- Claiming overrides produce certified / compliant / guaranteed-safe artifacts

### Bounded local CLI policy (6.18+)

**Status:** experimental, additive. Wired into `agent-inspect redact --policy` and `agent-inspect verify-safe --policy`.

A policy is a **local JSON file**. It only **adds** sensitive keys and bounded value patterns on top of the built-in profiles. It can never remove or weaken built-in high-confidence protection.

```json
{
  "policyVersion": 1,
  "sensitiveKeys": ["houseSecret"],
  "valuePatterns": [
    { "id": "house-prefix", "type": "prefix", "prefix": "hsk_", "severity": "error" },
    { "id": "house-kv", "type": "key-value", "key": "house_token", "minSecretLength": 12 }
  ]
}
```

Pattern types (no raw regex is accepted):

| Type | Matches |
|------|---------|
| `prefix` | a token starting with `prefix` at a word boundary, followed by at least `minSecretLength` secret-like characters |
| `key-value` | `key=value` or `key: value` inside a string, where the value has at least `minSecretLength` secret-like characters |

Per-rule fields: `id` (required, `[A-Za-z0-9._-]`), `type`, `prefix` or `key`, optional `minSecretLength` (default `8`), optional `severity` (`warning` default, or `error`).

Bounds and rejections:

| Bound | Limit |
|-------|-------|
| policy file size | 64 KiB |
| total rules (`sensitiveKeys` + `valuePatterns`) | 200 |
| `sensitiveKeys` / `key` length | 128 |
| `prefix` length | 3–64 |
| `id` length | 64 |
| `minSecretLength` | 1–256 |

The loader rejects unknown top-level and per-rule fields, a `policyVersion` other than `1`, duplicate rule ids, non-ASCII identifier characters, malformed JSON, directories, and oversized files. There is **no** JavaScript execution, **no** remote policy URL, and **no** environment interpolation — `${HOME}`-style text is literal and fails identifier validation. Matching is a bounded linear scan with no user-supplied regex, so a policy cannot introduce catastrophic backtracking.

Policy detectors appear as `policy.<id>` in `redact --json` findings and in `verify-safe` `redactionSummary.detectors`. Both commands compile the same policy and apply it to the same detector pipeline. Matched values are never printed.

Invalid policies fail loudly: `redact` exits `1` with a `--policy …` message; `verify-safe` reports `AI_SAFETY_INVALID_ARGUMENTS` with status `UNKNOWN`.

### Residual safety after `redact` (6.18+)

`redact` writes a derived copy and never mutates the source. It does **not** certify that the copy is safe to share. Each run reports a `residualAssessment` describing what the local safety pipeline still finds in the redacted output, so operators know whether `verify-safe` will still flag it. Default output and exit codes are unchanged; `--fail-on-residual` is the explicit opt-in that turns residual risk into a non-zero exit. See [CLI.md](CLI.md#611-redact) for the field contract.

### Explain + review loop

```bash
npx agent-inspect scan ./trace.jsonl --explain
npx agent-inspect verify-safe ./trace.jsonl --explain --json
npx agent-inspect redact ./trace.jsonl --profile share -o ./trace.share.jsonl
npx agent-inspect verify-safe ./trace.share.jsonl --explain
```

`verify-safe` reports **source** and **artifact** assessments; bundle gating (CLI and MCP `create_share_safe_bundle`) uses the **artifact** assessment after the selected redaction profile.

## Related

- Repair policy: [V6.9.X-SAFETY-REPAIR-POLICY.md](./implementation/release-trains/V6.9.X-SAFETY-REPAIR-POLICY.md)
- CLI: `agent-inspect scan` · `verify-safe` · `redact` · `bundle`
- Package: `@agent-inspect/redact`
- Safe sharing guide: [SAFE-TRACE-SHARING.md](./SAFE-TRACE-SHARING.md)
