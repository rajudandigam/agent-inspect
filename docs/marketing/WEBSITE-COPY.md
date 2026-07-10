# AgentInspect Website Copy

Source copy for the marketing site (aligned with **6.7.x** product presentation). Prefer `apps/website/lib/product.ts` for version/package count.

## Hero

**Eyebrow:** Local trajectory evidence for TypeScript agents

**Headline:** Debug, regression-test, and safely share AI-agent behavior locally

**Subheadline:** From one broken run to a deterministic contract, CI gate, and verified-safe bundle—without sending traces to AgentInspect.

**Trust:** No account · no default upload · metadata-only by default · optional customer-owned Studio

**Primary command:** `npm install agent-inspect`

**CTAs:** Run the five-minute path · See the golden workflow · View on GitHub

## Five-minute path

```bash
npm install agent-inspect
npx agent-inspect init --yes
node examples/agent-inspect-demo.mjs
npx agent-inspect list --dir .agent-inspect
# copy <run-id> from list, then:
npx agent-inspect view <run-id> --dir .agent-inspect
npx agent-inspect check <run-id> --dir .agent-inspect
npx agent-inspect bundle <run-id> --dir .agent-inspect --profile share
npx agent-inspect verify-safe <run-id> --dir .agent-inspect
```

**Note:** `init` scaffolds files; the demo writes the trace. No API keys required.

## Evidence loop

1. Capture or import
2. Understand causality
3. Enforce expectations
4. Verify and bundle
5. Review locally or in customer-owned Studio Beta

## Comparison

- **Team dashboard:** No maintainer-hosted dashboard; optional customer-owned Studio Beta
- **Production monitoring:** Not the goal
- **Best for:** Local debugging, deterministic trajectory regression, safe evidence, customer-owned review

## FAQ themes

- No default upload / explicit network surfaces
- Studio is customer-owned
- Not production APM
- Support levels Stable/Beta/Preview
- Metadata-only; no chain-of-thought
- v7 not scheduled pending adoption evidence
