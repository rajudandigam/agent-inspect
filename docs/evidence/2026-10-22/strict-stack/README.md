# Strict-stack redaction — pre-fix 6.31.23 evidence

- [Original synthetic source](source.jsonl)
- [Derived strict trace from 6.31.23](strict-6.31.23.jsonl)

The source error deliberately contains `SYNTHETIC_PRIVATE_CONTEXT_N05` and the
fake path `/private/synthetic-customer/app.ts:12:3`. In the saved strict trace,
`error.message` is redacted but `error.stack` still contains the marker and fake
path. These two files preserve the original bytes from the October 22 packet.

The correction shipped in
[6.31.25](https://github.com/rajudandigam/agent-inspect/releases/tag/agent-inspect%406.31.25)
and is included in 6.31.27. The
[fix and regression tests](https://github.com/rajudandigam/agent-inspect/commit/67563a29289801e85395de030aae072166384ce6)
cover strict `stack`, `errorStack`, and `stackTrace` redaction, including nested
copies, while preserving the source. Local and share profiles retain stacks.

For a focused comparison, use a fresh working directory and the published
6.31.27 CLI to redact a copy of `source.jsonl` with `--profile strict`. Compare
the resulting file with the saved pre-fix output, and record the exact command
and installed version. The expected correction is that neither marker nor fake
path remains in the derived strict output. Verify separately that the original
source bytes remain unchanged. Do not overwrite the historical files here.

This folder does not contain a fresh 6.31.27 run. It also does not resolve the
synthetic tenant text retained in `operationId`, preservation of tenant joins
after redaction, or the separate NestJS/HTML/CLI review findings. A `SAFE` result
does not establish that every sensitive identifier has been removed.

See [snapshot provenance](../README.md) and [checksums](../manifest.json).
