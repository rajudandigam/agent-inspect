# AgentInspect Website Copy

Source copy for the marketing site (aligned with **6.17.x**). Prefer `apps/website/lib/product.ts` for version/package count.

## Hero

**Eyebrow:** Local evidence debugger

**Headline:** See what your agent did. Catch the wrong path in CI. Keep the evidence local.

**Subheadline:** AgentInspect turns TypeScript agent runs into readable execution trees, deterministic trajectory checks, and portable Evidence v2—without requiring an account, collector, or default upload.

**Trust:** No account · no collector · no default upload · metadata-only by default

**Primary command:** `npm install agent-inspect`

**CTAs:** Run the five-minute path · Trajectory checks · View on GitHub

**Hero flow:**

```text
1. Capture one local run
2. Debug the execution tree
3. Prevent the wrong trajectory in CI
4. Share-checked Evidence v2
5. Optional: inspect the same facts over read-only MCP
```

## Five-minute path

```bash
npm install agent-inspect
npx agent-inspect init --yes
node examples/agent-inspect-demo.mjs
npx agent-inspect list --dir .agent-inspect
# copy <run-id> from list, then:
npx agent-inspect report <run-id> --dir .agent-inspect
npx agent-inspect check <run-id> --dir .agent-inspect
npx agent-inspect bundle <run-id> --dir .agent-inspect --profile share
npx agent-inspect verify-safe <run-id> --dir .agent-inspect
npx agent-inspect bundle verify .agent-inspect/bundles/<run-id>
npx agent-inspect mcp configure --client cursor
```

**Note:** `init` scaffolds files; the demo writes the trace. No API keys required. MCP configure is dry-run by default.

## Comparison

- **Team dashboard:** No maintainer-hosted dashboard; optional customer-owned Studio Beta (Tier C)
- **Coding-agent inspect:** Read-only MCP Preview over local traces
- **Production monitoring:** Not the goal
- **Best for:** Local debugging, deterministic trajectory regression, share-checked evidence, coding-agent loops

## FAQ themes

- No default upload / explicit network surfaces
- Coding-agent MCP loop (Preview)
- Studio is customer-owned
- Not production APM
- Support levels Stable/Beta/Preview
- Metadata-only; no chain-of-thought
- v7 not scheduled pending adoption evidence
