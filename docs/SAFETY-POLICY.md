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

CLI custom policy files are **not** supported yet. Do not put secrets on the command line.
3. **CLI size thresholds** on `scan` / `verify-safe` (`--max-string-length`, etc.) when oversized findings are false positives for your workload.
4. **Bundle write override** with explicit `--allow-unsafe` after reviewing `verify-safe --explain` (records that the artifact was not share-gated).

High-confidence built-in credentials (including bounded `token=` / `api_key=` / `internal_token=` forms) are covered by built-in redaction profiles. Context-sensitive findings such as private filesystem paths may remain verification-only when automatic erasure would create excessive false positives or destroy legitimate debugging context. `redact` remains best-effort; `verify-safe` remains the final automated local assessment before sharing.

### Disallowed

- Shipping weakened default profiles in shared configs without review
- Disabling detectors globally “to make CI green”
- Printing matched secret/PII values in CI logs or MCP tool output
- Claiming overrides produce certified / compliant / guaranteed-safe artifacts

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
