# Self-hosting ingestion security (v6.6.1)

Opt-in hardening for customer-hosted Studio HTTP/bundle ingest. **No default network behavior.**

## Threat model

| Actor | Risk |
|-------|------|
| Trusted administrator | Misconfiguration exposing ingest without TLS |
| Untrusted trace uploader | Oversized payload, zip slip, token brute force |
| Compromised CI artifact | Malicious archive metadata |

## Hardening (opt-in)

- `ingest.http.maxBytes` — bounded request bodies (default enforced in registry validation)
- `ingest.bundleUpload.maxBytes` — bounded bundle uploads
- `AGENT_INSPECT_STUDIO_TOKEN` — required bearer token when auth enabled
- Reverse-proxy TLS termination — documented; Studio does not terminate TLS by default
- Token rotation — rotate env token; no hot reload required

## Non-goals

- No default open ingest
- No hosted multi-tenant isolation (single-tenant admin model)
