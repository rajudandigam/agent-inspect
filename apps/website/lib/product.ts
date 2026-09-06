/**
 * Public product metadata for the marketing site.
 * Keep in sync with docs/product/PUBLIC-PRODUCT-FACTS.json and root package.json.
 */
export const product = {
  version: "6.18.0",
  publicPackageCount: 18,
  releaseStatus: "Actively maintained · schema 1.0 · Node.js 20+ · MIT",
  v7Scheduled: false,
  trustLine:
    "No account · no collector · no default upload · metadata-only by default",
  headline: "See what your agent did. Catch the wrong path in CI. Keep the evidence local.",
  subheadline:
    "AgentInspect turns TypeScript agent runs into readable execution trees, deterministic trajectory checks, and portable Evidence v2—without requiring an account, collector, or default upload.",
  outcome: "Capture once. Debug, prevent, and share from the same local trace.",
  category: "Local-first evidence for TypeScript AI agents",
  proof: [
    "Zero open pilot findings at the 6.16.0 moderate + deep-swarm gates.",
    "Hardening timeline 6.7.3 → 6.16.0; Evidence UX in 6.17.1; fixture-backed demos.",
  ] as const,
  pillars: [
    {
      id: "debug",
      title: "Debug",
      summary: "Read nested steps, tools, model metadata, and the first causal failure from local JSONL.",
    },
    {
      id: "prevent",
      title: "Prevent",
      summary:
        "Deterministic check presets, TraceContract, suites, and CI gates — no LLM judge required.",
    },
    {
      id: "share",
      title: "Share",
      summary:
        "Share-checked Evidence v2 with integrity verification. Not a compliance certification.",
    },
  ] as const,
  heroFlow: `1. Capture one local run
2. Debug the execution tree
3. Prevent the wrong trajectory in CI
4. Share-checked Evidence v2
5. Optional: inspect the same facts over read-only MCP`,
  fiveMinuteCommands: `npm install agent-inspect
npx agent-inspect init --yes
node examples/agent-inspect-demo.mjs
npx agent-inspect list --dir .agent-inspect
# copy <run-id> from list, then:
npx agent-inspect report <run-id> --dir .agent-inspect
npx agent-inspect check <run-id> --dir .agent-inspect
npx agent-inspect bundle <run-id> --dir .agent-inspect --profile share
npx agent-inspect verify-safe <run-id> --dir .agent-inspect
# Evidence v2 integrity (path from bundle output):
npx agent-inspect bundle verify .agent-inspect/bundles/<run-id>
# Optional coding-agent loop (dry-run by default):
npx agent-inspect mcp configure --client cursor`,
} as const;
